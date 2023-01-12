export declare const createRequest: (name: string, id: number, params?: Uint8Array) => Uint8Array;
export declare const createNotification: (name: string, params?: Uint8Array) => Uint8Array;
export declare const createResponse: (id: number, result?: Uint8Array) => Uint8Array;
export declare const createError: (id: number, message: string, code?: number, data?: Uint8Array) => Uint8Array;
export declare const createMethodNotFoundError: (id: number) => Uint8Array;
