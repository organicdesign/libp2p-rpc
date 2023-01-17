import type { PeerId } from "@libp2p/interface-peer-id";
import { logger } from "@libp2p/logger";
import { createMessageHandler, MessageHandler, MessageHandlerComponents } from "@organicdesign/libp2p-message-handler";
import { RPCMessage, RPCError } from "./RPCProtocol.js";
import * as Messages from "./RPCMessages.js";

const log = {
	general: logger("libp2p:rpc")
};

export interface RPCOpts {
	protocol: string
}

export type RPCComponents = MessageHandlerComponents;

export type RPCMethod = (params: Uint8Array | undefined, sender: PeerId) => Promise<Uint8Array | void> | Uint8Array | void;

interface Resolver {
	resolve: (result?: Uint8Array) => void
	reject: (error: RPCError) => void
}

export class RPC {
	private readonly options: RPCOpts;
	private readonly methods = new Map<string, RPCMethod>();
	private readonly msgPromises = new Map<number, Resolver>();
	private readonly handler: MessageHandler;

	private readonly genMsgId = (() => {
		let id = 0;

		return () => id++;
	})();

	constructor (components: RPCComponents, options: Partial<RPCOpts> = {}) {
		this.options = {
			protocol: options.protocol ?? "/libp2p-rpc/0.0.1",
		};

		this.handler = createMessageHandler({ protocol: this.options.protocol })(components);
	}

	async start () {
		await this.handler.start();

		this.handler.handle((message, peer) => {
			this.handleMessage(RPCMessage.decode(message), peer);
		});

		log.general("started");
	}

	async stop () {
		await this.handler.stop();

		log.general("stopped");
	}

	addMethod (name: string, method: RPCMethod) {
		this.methods.set(name, method);
	}

	async request (peer: PeerId, name: string, params?: Uint8Array): Promise<Uint8Array | undefined> {
		const messageId = this.genMsgId();

		try {
			await this.handler.send(Messages.createRequest(name, messageId, params), peer);
		} catch (error) {
			log.general.error("failed to send message: %o", error);

			const newError: RPCError = {
				code: -32000,
				message: error.message
			};

			throw newError;
		}

		log.general("request '%s' on peer: %p", name, peer);

		return await new Promise((resolve, reject) => {
			this.msgPromises.set(messageId, { resolve, reject });
		});
	}

	notify (peer: PeerId, name: string, params?: Uint8Array) {
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
			let error: Error & RPCError | null = null;

			try {
				log.general("method '%s' called by peer: %p", request.name, peer);
				result = await method(request.params, peer) ?? undefined;
			} catch (err) {
				log.general.error("method '%s' threw error: %o", err);
				error = err;
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

			resolver.reject(response.error);
		}
	}
}

export const createRPC = (options?: Partial<RPCOpts>) => (components: RPCComponents) => new RPC(components, options);
