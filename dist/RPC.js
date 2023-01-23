var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { logger } from "@libp2p/logger";
import { createMessageHandler } from "@organicdesign/libp2p-message-handler";
import { RPCMessage } from "./RPCProtocol.js";
import * as Messages from "./RPCMessages.js";
import { RPCException } from "./RPCException.js";
const log = {
    general: logger("libp2p:rpc")
};
export class RPC {
    constructor(components, options = {}) {
        var _a, _b;
        this.methods = new Map();
        this.msgPromises = new Map();
        this.started = false;
        this.genMsgId = (() => {
            let id = 0;
            return () => id++;
        })();
        this.options = {
            protocol: (_a = options.protocol) !== null && _a !== void 0 ? _a : "/libp2p-rpc/0.0.1",
            timeout: (_b = options.timeout) !== null && _b !== void 0 ? _b : 5000
        };
        this.handler = createMessageHandler({ protocol: this.options.protocol })(components);
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isStarted()) {
                return;
            }
            yield this.handler.start();
            this.handler.handle((message, peer) => {
                this.handleMessage(RPCMessage.decode(message), peer);
            });
            this.started = true;
            log.general("started");
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isStarted()) {
                return;
            }
            yield this.handler.stop();
            // Reject the open promises.
            for (const promise of this.msgPromises.values()) {
                promise.reject(new RPCException("RPC module stopped", -32001));
            }
            this.msgPromises.clear();
            this.methods.clear();
            this.started = false;
            log.general("stopped");
        });
    }
    isStarted() {
        return this.started;
    }
    addMethod(name, method) {
        this.methods.set(name, method);
    }
    hasMethod(name) {
        return this.methods.has(name);
    }
    removeMethod(name) {
        return this.methods.delete(name);
    }
    request(peer, name, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const messageId = this.genMsgId();
            try {
                yield this.handler.send(Messages.createRequest(name, messageId, params), peer);
            }
            catch (error) {
                log.general.error("failed to send message: %o", error);
                const newError = new RPCException(error.message, -32000);
                throw newError;
            }
            log.general("request '%s' on peer: %p", name, peer);
            return yield new Promise((resolve, reject) => {
                if (this.options.timeout < 0) {
                    return;
                }
                const timeoutError = new RPCException("Request timed out", -32003);
                const timeout = setTimeout(() => reject(timeoutError), this.options.timeout);
                this.msgPromises.set(messageId, {
                    resolve(result) {
                        clearTimeout(timeout);
                        resolve(result);
                    },
                    reject(error) {
                        clearTimeout(timeout);
                        reject(error);
                    }
                });
            });
        });
    }
    notify(peer, name, params) {
        this.handler.send(Messages.createNotification(name, params), peer).catch(() => { });
        log.general("notify '%s' on peer: %p", name, peer);
    }
    // Handle receiving a messsage calling RPC methods or resolving responses.
    handleMessage(message, peer) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { request, response } = message;
            if (request != null) {
                const method = this.methods.get(request.name);
                if (!method) {
                    if (request.id == null) {
                        return;
                    }
                    return yield this.handler.send(Messages.createMethodNotFoundError(request.id), peer);
                }
                let result;
                let error = null;
                try {
                    log.general("method '%s' called by peer: %p", request.name, peer);
                    result = (_a = yield method(request.params, peer)) !== null && _a !== void 0 ? _a : undefined;
                }
                catch (err) {
                    log.general.error("method '%s' threw error: %o", err);
                    if (err instanceof RPCException) {
                        error = err;
                    }
                    else if (err instanceof Error) {
                        error = new RPCException(err.message, 0);
                        error.stack = err.stack;
                    }
                    else {
                        try {
                            error = new RPCException(JSON.stringify(err), -32002);
                        }
                        catch (err) {
                            error = new RPCException("Unknown error", -32002);
                        }
                    }
                }
                if (request.id == null) {
                    return;
                }
                if (error != null) {
                    return yield this.handler.send(Messages.createError(request.id, error.message, error.code), peer);
                }
                return yield this.handler.send(Messages.createResponse(request.id, result), peer);
            }
            if (response) {
                const resolver = this.msgPromises.get(response.id);
                if (resolver == null) {
                    return;
                }
                this.msgPromises.delete(response.id);
                if (response.error == null) {
                    return resolver.resolve(response.result);
                }
                resolver.reject(new RPCException(response.error.message, response.error.code, response.error.data));
            }
        });
    }
}
export const createRPC = (options) => (components) => new RPC(components, options);
