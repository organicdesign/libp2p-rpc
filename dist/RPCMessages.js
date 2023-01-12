import { RPCMessage } from "./RPCProtocol.js";
export const createRequest = (name, id, params) => RPCMessage.encode({
    request: {
        name,
        id,
        params
    }
});
export const createNotification = (name, params) => RPCMessage.encode({
    request: {
        name,
        params
    }
});
export const createResponse = (id, result) => RPCMessage.encode({
    response: {
        id,
        result
    }
});
export const createError = (id, message, code, data) => RPCMessage.encode({
    response: {
        id,
        error: {
            code: code !== null && code !== void 0 ? code : 0,
            message,
            data
        }
    }
});
export const createMethodNotFoundError = (id) => createError(id, "Method not found", -32601);
