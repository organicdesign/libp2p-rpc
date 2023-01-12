import type { ConnectionManager } from "@libp2p/interface-connection-manager";
import type { Registrar } from "@libp2p/interface-registrar";
import type { PeerId } from "@libp2p/interface-peer-id";
export interface RPCOpts {
    protocol: string;
}
export interface RPCComponents {
    connectionManager: ConnectionManager;
    registrar: Registrar;
}
type RPCMethod = (params: Uint8Array | undefined, sender: PeerId) => Promise<Uint8Array | void> | Uint8Array | void;
export declare class RPC {
    private readonly options;
    private readonly components;
    private readonly methods;
    private readonly writers;
    private readonly msgPromises;
    private readonly genMsgId;
    constructor(components: RPCComponents, options?: Partial<RPCOpts>);
    start(): Promise<void>;
    stop(): Promise<void>;
    addMethod(name: string, method: RPCMethod): void;
    request(peer: PeerId, name: string, params?: Uint8Array): Promise<Uint8Array | undefined>;
    notify(peer: PeerId, name: string, params?: Uint8Array): void;
    private handleMessage;
    private establishStream;
    private handleStream;
}
export declare const createRPC: (options?: Partial<RPCOpts>) => (components: RPCComponents) => RPC;
export {};
