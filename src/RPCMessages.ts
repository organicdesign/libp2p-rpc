import { RPCMessage } from "./RPCProtocol.js";

export const createRequest = (name: string, id: number, params?: Uint8Array) => RPCMessage.encode({
	request: {
		name,
		id,
		params
	}
});

export const createNotification = (name: string, params?: Uint8Array) => RPCMessage.encode({
	request: {
		name,
		params
	}
});

export const createResponse = (id: number, result?: Uint8Array) => RPCMessage.encode({
	response: {
		id,
		result
	}
});

export const createError = (id: number, message: string, code?: number, data?: Uint8Array) => RPCMessage.encode({
	response: {
		id,
		error: {
			code: code ?? 0,
			message,
			data
		}
	}
});

export const createMethodNotFoundError = (id: number) => createError(id, "Method not found", -32601);
