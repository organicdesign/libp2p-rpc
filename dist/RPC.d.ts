import type { PeerId } from "@libp2p/interface-peer-id";
import type { Startable } from "@libp2p/interfaces/startable";
import { MessageHandlerComponents } from "@organicdesign/libp2p-message-handler";
export interface RPCOpts {
    protocol: string;
    timeout: number;
}
export interface RPCComponents extends MessageHandlerComponents {
}
export type RPCMethod = (params: Uint8Array | undefined, sender: PeerId) => Promise<Uint8Array | void> | Uint8Array | void;
export declare class RPC implements Startable {
    private readonly options;
    private readonly methods;
    private readonly msgPromises;
    private readonly handler;
    private started;
    private readonly genMsgId;
    constructor(components: RPCComponents, options?: Partial<RPCOpts>);
    start(): Promise<void>;
    stop(): Promise<void>;
    isStarted(): boolean;
    addMethod(name: string, method: RPCMethod): void;
    hasMethod(name: string): boolean;
    removeMethod(name: string): boolean;
    request(peer: PeerId, name: string, params?: Uint8Array): Promise<Uint8Array | undefined>;
    notify(peer: PeerId, name: string, params?: Uint8Array): void;
    private handleMessage;
}
export declare const createRPC: (options?: Partial<RPCOpts>) => (components: RPCComponents) => RPC;
