import type { ConnectionManager } from "@libp2p/interface-connection-manager";
import type { Connection, Stream } from "@libp2p/interface-connection";
import type { Registrar } from "@libp2p/interface-registrar";
import type { PeerId } from "@libp2p/interface-peer-id";
import * as lp from "it-length-prefixed";
import { pipe } from "it-pipe";
import { pushable, Pushable } from "it-pushable";
import { RPCMessage, RPCError } from "./RPCProtocol.js";

export interface RPCOpts {
	protocol: string
}

export interface RPCComponents {
	connectionManager: ConnectionManager
	registrar: Registrar
}

type RPCMethod = (params: Uint8Array | undefined, sender: PeerId) => Promise<Uint8Array | void> | Uint8Array | void;

interface Resolver {
	resolve: (result?: Uint8Array) => void
	reject: (error: RPCError) => void
}

export class RPC {
	private readonly options: RPCOpts;
	private readonly components: RPCComponents;
	private readonly methods = new Map<string, RPCMethod>();
	private readonly writers = new Map<string, Pushable<Uint8Array>>();
	private readonly msgPromises = new Map<number, Resolver>();

	private readonly genMsgId = (() => {
		let id = 0;

		return () => id++;
	})();

	constructor (components: RPCComponents, options: Partial<RPCOpts> = {}) {
		this.options = {
			protocol: options.protocol ?? "/libp2p-rpc/0.0.1",
		};

		this.components = components;
	}

	async start () {
		await this.components.registrar.handle(this.options.protocol, async ({ stream, connection }) => {
			this.handleStream(stream, connection);
		});
	}

	async stop () {
		await this.components.registrar.unhandle(this.options.protocol);
	}

	addMethod (name: string, method: RPCMethod) {
		this.methods.set(name, method);
	}

	async request (peer: PeerId, name: string, params?: Uint8Array) {
		const writer = await this.establishStream(peer);
		const messageId = this.genMsgId();

		writer.push(RPCMessage.encode({
			request: {
				id: messageId,
				params,
				name
			}
		}));

		return await new Promise((resolve, reject) => {
			this.msgPromises.set(messageId, { resolve, reject });
		});
	}

	notify (peer: PeerId, name: string, params?: Uint8Array) {
		this.establishStream(peer).then(writer => {
			writer.push(RPCMessage.encode({
				request: {
					id: this.genMsgId(),
					params,
					name
				}
			}));
		}).catch(() => {});
	}

	private async handleMessage (message: RPCMessage, peer: PeerId) {
		const { request, response } = message;

		if (request != null) {
			const method = this.methods.get(request.name);
			const writer = this.writers.get(peer.toString());

			if (!method && request.id == null) {
				return;
			}

			if (!method) {
				return writer?.push(RPCMessage.encode({
					response: {
						id: request.id!,
						error: {
							code: -32601,
							message: "Method not found"
						}
					}
				}));
			}

			let result: Uint8Array | undefined;
			let error: Error & { code?: number } | null = null;

			try {
				result = await method(request.params, peer) ?? undefined;
			} catch (err) {
				error = err;
			}

			if (request.id == null) {
				return;
			}

			if (error != null) {
				return writer?.push(RPCMessage.encode({
					response: {
						id: request.id,
						error: {
							code: error.code ?? 0,
							message: error.message
						}
					}
				}));
			}

			return writer?.push(RPCMessage.encode({
				response: {
					id: request.id,
					result
				}
			}));
		}

		if (response) {
			const resolver = this.msgPromises.get(response.id);

			if (resolver == null) {
				return;
			}

			this.msgPromises.delete(response.id);

			if (response.result) {
				resolver.resolve(response.result);
			}

			if (response.error) {
				resolver.reject(response.error);
			}
		}
	}

	private async establishStream (peer: PeerId) {
		const connection = this.components.connectionManager.getConnections().find(c => c.remotePeer.equals(peer));

		if (connection == null) {
			throw new Error("not connected");
		}

		for (const stream of connection.streams) {
			if (this.writers.has(stream.id)) {
				// We already have a stream open.
				return this.writers.get(stream.id)!;
			}
		}

		let writer: Pushable<Uint8Array>;

		await this.components.registrar.handle(this.options.protocol, async ({ stream, connection }) => {
			writer = this.handleStream(stream, connection);
		});

		return writer!;
	}

	private handleStream (stream: Stream, connection: Connection) {
		const that = this;
		const peerId = connection.remotePeer.toString();

		// Handle inputs.
		pipe(stream, lp.decode(), async function (source) {
			for await (const message of source) {
				await that.handleMessage(RPCMessage.decode(message), connection.remotePeer);
			}
		}).catch(() => {
			// Do nothing
		});

		// Don't pipe events through the same connection
		if (this.writers.has(peerId)) {
			return this.writers.get(peerId)!;
		}

		const writer = pushable();

		this.writers.set(peerId, writer);

		// Handle outputs.
		(async () => {
			try {
				await pipe(writer, lp.encode(), stream);
			} finally {
				this.writers.delete(peerId);
			}
		})();

		return writer;
	}
}

export const createRPC = (options?: Partial<RPCOpts>) => (components: RPCComponents) => new RPC(components, options);
