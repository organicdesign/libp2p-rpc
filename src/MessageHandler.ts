import type { ConnectionManager } from "@libp2p/interface-connection-manager";
import type { Connection, Stream } from "@libp2p/interface-connection";
import type { Registrar } from "@libp2p/interface-registrar";
import type { PeerId } from "@libp2p/interface-peer-id";
import * as lp from "it-length-prefixed";
import { pipe } from "it-pipe";
import { pushable, Pushable } from "it-pushable";

export interface MessageHandlerComponents {
	connectionManager: ConnectionManager
	registrar: Registrar
}

export interface MessageHandlerOpts {
	protocol: string
}

type Handler = (message: Uint8Array, peer: PeerId) => void;

export class MessageHandler {
	private readonly components: MessageHandlerComponents;
	private readonly options: MessageHandlerOpts;
	private readonly writers = new Map<string, Pushable<Uint8Array>>();
	private readonly handlers = new Set<Handler>();

	constructor (components: MessageHandlerComponents, options: Partial<MessageHandlerOpts> = {}) {
		this.components = components;

		this.options = {
			protocol: options.protocol ?? "/message-handler/0.0.1",
		};
	}

	async start () {
		await this.components.registrar.handle(this.options.protocol, async ({ stream, connection }) => {
			this.handleStream(stream, connection);
		});
	}

	async stop () {
		await this.components.registrar.unhandle(this.options.protocol);
	}

	async send (peer: PeerId, message: Uint8Array) {
		const writer = await this.establishStream(peer);

		writer.push(message);
	}

	handle (handler: Handler) {
		this.handlers.add(handler);
	}

	unhandle (handler: Handler) {
		this.handlers.delete(handler);
	}

	// Establish a stream to a peer reusing an existing one if it already exists.
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

		const stream = await connection.newStream(this.options.protocol);

		return this.handleStream(stream, connection);
	}

	private handleStream (stream: Stream, connection: Connection) {
		const handlers = this.handlers;
		const peerId = connection.remotePeer.toString();

		// Handle inputs.
		pipe(stream, lp.decode(), async function (source) {
			for await (const message of source) {
				for (const handler of handlers) {
					handler(message.subarray(), connection.remotePeer);
				}
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

export const createMessageHandler = (options?: Partial<MessageHandlerOpts>) => (components: MessageHandlerComponents) => new MessageHandler(components, options);
