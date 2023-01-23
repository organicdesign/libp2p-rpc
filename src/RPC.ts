import type { PeerId } from "@libp2p/interface-peer-id";
import type { Startable } from "@libp2p/interfaces/startable";
import { logger } from "@libp2p/logger";
import {
	createMessageHandler,
	MessageHandler,
	MessageHandlerComponents
} from "@organicdesign/libp2p-message-handler";
import { RPCMessage } from "./RPCProtocol.js";
import * as Messages from "./RPCMessages.js";
import { RPCException } from "./RPCException.js";

const log = {
	general: logger("libp2p:rpc")
};

export interface RPCOpts {
	protocol: string,
	timeout: number
}

export interface RPCComponents extends MessageHandlerComponents {}

export type RPCMethod = (params: Uint8Array | undefined, sender: PeerId) => Promise<Uint8Array | void> | Uint8Array | void;

interface Resolver {
	resolve: (result?: Uint8Array) => void
	reject: (error: RPCException) => void
}

export class RPC implements Startable {
	private readonly options: RPCOpts;
	private readonly methods = new Map<string, RPCMethod>();
	private readonly msgPromises = new Map<number, Resolver>();
	private readonly handler: MessageHandler;
	private started = false;

	private readonly genMsgId = (() => {
		let id = 0;

		return () => id++;
	})();

	constructor (components: RPCComponents, options: Partial<RPCOpts> = {}) {
		this.options = {
			protocol: options.protocol ?? "/libp2p-rpc/0.0.1",
			timeout: options.timeout ?? 5000
		};

		this.handler = createMessageHandler({ protocol: this.options.protocol })(components);
	}

	async start (): Promise<void> {
		if (this.isStarted()) {
			return;
		}

		await this.handler.start();

		this.handler.handle((message, peer) => {
			this.handleMessage(RPCMessage.decode(message), peer);
		});

		this.started = true;

		log.general("started");
	}

	async stop (): Promise<void> {
		if (!this.isStarted()) {
			return;
		}

		await this.handler.stop();

		// Reject the open promises.
		for (const promise of this.msgPromises.values()) {
			promise.reject(new RPCException("RPC module stopped", -32001));
		}

		this.msgPromises.clear();
		this.methods.clear();

		this.started = false;

		log.general("stopped");
	}

	isStarted(): boolean {
		return this.started;
	}

	addMethod (name: string, method: RPCMethod): void {
		this.methods.set(name, method);
	}

	hasMethod (name: string): boolean {
		return this.methods.has(name);
	}

	removeMethod (name: string): boolean {
		return this.methods.delete(name);
	}

	async request (peer: PeerId, name: string, params?: Uint8Array): Promise<Uint8Array | undefined> {
		const messageId = this.genMsgId();

		try {
			await this.handler.send(Messages.createRequest(name, messageId, params), peer);
		} catch (error) {
			log.general.error("failed to send message: %o", error);

			const newError = new RPCException(error.message, -32000);

			throw newError;
		}

		log.general("request '%s' on peer: %p", name, peer);

		return await new Promise((resolve, reject) => {
			if (this.options.timeout < 0) {
				return;
			}

			const timeoutError = new RPCException("Request timed out", -32003);
			const timeout = setTimeout(() => reject(timeoutError), this.options.timeout);

			this.msgPromises.set(messageId, {
				resolve (result) {
					clearTimeout(timeout);
					resolve(result);
				},
				reject (error) {
					clearTimeout(timeout);
					reject(error);
				}
			});
		});
	}

	notify (peer: PeerId, name: string, params?: Uint8Array): void {
		this.handler.send(Messages.createNotification(name, params), peer).catch(() => {});

		log.general("notify '%s' on peer: %p", name, peer);
	}

	// Handle receiving a messsage calling RPC methods or resolving responses.
	private async handleMessage (message: RPCMessage, peer: PeerId) {
		const { request, response } = message;

		if (request != null) {
			const method = this.methods.get(request.name);

			if (!method) {
				if (request.id == null) {
					return;
				}

				return await this.handler.send(Messages.createMethodNotFoundError(request.id), peer);
			}

			let result: Uint8Array | undefined;
			let error: RPCException | null = null;

			try {
				log.general("method '%s' called by peer: %p", request.name, peer);
				result = await method(request.params, peer) ?? undefined;
			} catch (err) {
				log.general.error("method '%s' threw error: %o", err);

				if (err instanceof RPCException) {
					error = err;
				} else if (err instanceof Error) {
					error = new RPCException(err.message, 0);
					error.stack = err.stack;
				} else {
					try {
						error = new RPCException(JSON.stringify(err), -32002);
					} catch (err) {
						error = new RPCException("Unknown error", -32002);
					}
				}
			}

			if (request.id == null) {
				return;
			}

			if (error != null) {
				return await this.handler.send(Messages.createError(request.id, error.message, error.code), peer);
			}

			return await this.handler.send(Messages.createResponse(request.id, result), peer);
		}

		if (response) {
			const resolver = this.msgPromises.get(response.id);

			if (resolver == null) {
				return;
			}

			this.msgPromises.delete(response.id);

			if (response.error == null) {
				return resolver.resolve(response.result);
			}

			resolver.reject(new RPCException(response.error.message, response.error.code, response.error.data));
		}
	}
}

export const createRPC = (options?: Partial<RPCOpts>) => (components: RPCComponents) => new RPC(components, options);
