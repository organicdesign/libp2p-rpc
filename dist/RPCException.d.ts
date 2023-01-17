export declare class RPCException extends Error {
    code: number;
    data?: Uint8Array;
    constructor(message: string, code: number, data?: any);
}
