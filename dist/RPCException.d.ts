import { RPCError } from "./RPCProtocol.js";
export declare class RPCException extends Error implements RPCError {
    code: number;
    data?: Uint8Array;
    constructor(message: string, code: number, data?: any);
}
