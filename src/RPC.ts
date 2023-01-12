import type { ConnectionManager } from "@libp2p/interface-connection-manager";

export interface RPCOpts {
	protocol: string
}

export interface RPCComponents {
	connectionManager: ConnectionManager
}

export class RPC {
	private readonly options: RPCOpts;
	private readonly components: RPCComponents;

	constructor(components: RPCComponents, options: Partial<RPCOpts> = {}) {
		this.options = {
			protocol: options.protocol ?? "/libp2p-rpc/0.0.1",
		};

		this.components = components;
	}
}

export const createRPC = (options?: Partial<RPCOpts>) => (components: RPCComponents) => new RPC(components, options);
