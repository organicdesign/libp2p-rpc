import type { Uint8ArrayList } from 'uint8arraylist';
import type { Codec } from 'protons-runtime';
export interface RPCRequest {
    name: string;
    params?: Uint8Array;
    id?: number;
}
export declare namespace RPCRequest {
    const codec: () => Codec<RPCRequest>;
    const encode: (obj: RPCRequest) => Uint8Array;
    const decode: (buf: Uint8Array | Uint8ArrayList) => RPCRequest;
}
export interface RPCError {
    code: number;
    message: string;
    data?: Uint8Array;
}
export declare namespace RPCError {
    const codec: () => Codec<RPCError>;
    const encode: (obj: RPCError) => Uint8Array;
    const decode: (buf: Uint8Array | Uint8ArrayList) => RPCError;
}
export interface RPCResponse {
    id: number;
    result?: Uint8Array;
    error?: RPCError;
}
export declare namespace RPCResponse {
    const codec: () => Codec<RPCResponse>;
    const encode: (obj: RPCResponse) => Uint8Array;
    const decode: (buf: Uint8Array | Uint8ArrayList) => RPCResponse;
}
export interface RPCMessage {
    request?: RPCRequest;
    response?: RPCResponse;
}
export declare namespace RPCMessage {
    const codec: () => Codec<RPCMessage>;
    const encode: (obj: RPCMessage) => Uint8Array;
    const decode: (buf: Uint8Array | Uint8ArrayList) => RPCMessage;
}
