/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
import { encodeMessage, decodeMessage, message } from 'protons-runtime';
export var RPCRequest;
(function (RPCRequest) {
    let _codec;
    RPCRequest.codec = () => {
        if (_codec == null) {
            _codec = message((obj, w, opts = {}) => {
                if (opts.lengthDelimited !== false) {
                    w.fork();
                }
                if (opts.writeDefaults === true || obj.name !== '') {
                    w.uint32(10);
                    w.string(obj.name);
                }
                if (obj.params != null) {
                    w.uint32(18);
                    w.bytes(obj.params);
                }
                if (obj.id != null) {
                    w.uint32(24);
                    w.uint32(obj.id);
                }
                if (opts.lengthDelimited !== false) {
                    w.ldelim();
                }
            }, (reader, length) => {
                const obj = {
                    name: ''
                };
                const end = length == null ? reader.len : reader.pos + length;
                while (reader.pos < end) {
                    const tag = reader.uint32();
                    switch (tag >>> 3) {
                        case 1:
                            obj.name = reader.string();
                            break;
                        case 2:
                            obj.params = reader.bytes();
                            break;
                        case 3:
                            obj.id = reader.uint32();
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                    }
                }
                return obj;
            });
        }
        return _codec;
    };
    RPCRequest.encode = (obj) => {
        return encodeMessage(obj, RPCRequest.codec());
    };
    RPCRequest.decode = (buf) => {
        return decodeMessage(buf, RPCRequest.codec());
    };
})(RPCRequest || (RPCRequest = {}));
export var RPCError;
(function (RPCError) {
    let _codec;
    RPCError.codec = () => {
        if (_codec == null) {
            _codec = message((obj, w, opts = {}) => {
                if (opts.lengthDelimited !== false) {
                    w.fork();
                }
                if (opts.writeDefaults === true || obj.code !== 0) {
                    w.uint32(8);
                    w.int32(obj.code);
                }
                if (opts.writeDefaults === true || obj.message !== '') {
                    w.uint32(18);
                    w.string(obj.message);
                }
                if (obj.data != null) {
                    w.uint32(26);
                    w.bytes(obj.data);
                }
                if (opts.lengthDelimited !== false) {
                    w.ldelim();
                }
            }, (reader, length) => {
                const obj = {
                    code: 0,
                    message: ''
                };
                const end = length == null ? reader.len : reader.pos + length;
                while (reader.pos < end) {
                    const tag = reader.uint32();
                    switch (tag >>> 3) {
                        case 1:
                            obj.code = reader.int32();
                            break;
                        case 2:
                            obj.message = reader.string();
                            break;
                        case 3:
                            obj.data = reader.bytes();
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                    }
                }
                return obj;
            });
        }
        return _codec;
    };
    RPCError.encode = (obj) => {
        return encodeMessage(obj, RPCError.codec());
    };
    RPCError.decode = (buf) => {
        return decodeMessage(buf, RPCError.codec());
    };
})(RPCError || (RPCError = {}));
export var RPCResponse;
(function (RPCResponse) {
    let _codec;
    RPCResponse.codec = () => {
        if (_codec == null) {
            _codec = message((obj, w, opts = {}) => {
                if (opts.lengthDelimited !== false) {
                    w.fork();
                }
                if (opts.writeDefaults === true || obj.id !== 0) {
                    w.uint32(8);
                    w.uint32(obj.id);
                }
                if (obj.result != null) {
                    w.uint32(18);
                    w.bytes(obj.result);
                }
                if (obj.error != null) {
                    w.uint32(26);
                    RPCError.codec().encode(obj.error, w, {
                        writeDefaults: false
                    });
                }
                if (opts.lengthDelimited !== false) {
                    w.ldelim();
                }
            }, (reader, length) => {
                const obj = {
                    id: 0
                };
                const end = length == null ? reader.len : reader.pos + length;
                while (reader.pos < end) {
                    const tag = reader.uint32();
                    switch (tag >>> 3) {
                        case 1:
                            obj.id = reader.uint32();
                            break;
                        case 2:
                            obj.result = reader.bytes();
                            break;
                        case 3:
                            obj.error = RPCError.codec().decode(reader, reader.uint32());
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                    }
                }
                return obj;
            });
        }
        return _codec;
    };
    RPCResponse.encode = (obj) => {
        return encodeMessage(obj, RPCResponse.codec());
    };
    RPCResponse.decode = (buf) => {
        return decodeMessage(buf, RPCResponse.codec());
    };
})(RPCResponse || (RPCResponse = {}));
export var RPCMessage;
(function (RPCMessage) {
    let _codec;
    RPCMessage.codec = () => {
        if (_codec == null) {
            _codec = message((obj, w, opts = {}) => {
                if (opts.lengthDelimited !== false) {
                    w.fork();
                }
                if (obj.request != null) {
                    w.uint32(10);
                    RPCRequest.codec().encode(obj.request, w, {
                        writeDefaults: false
                    });
                }
                if (obj.response != null) {
                    w.uint32(18);
                    RPCResponse.codec().encode(obj.response, w, {
                        writeDefaults: false
                    });
                }
                if (opts.lengthDelimited !== false) {
                    w.ldelim();
                }
            }, (reader, length) => {
                const obj = {};
                const end = length == null ? reader.len : reader.pos + length;
                while (reader.pos < end) {
                    const tag = reader.uint32();
                    switch (tag >>> 3) {
                        case 1:
                            obj.request = RPCRequest.codec().decode(reader, reader.uint32());
                            break;
                        case 2:
                            obj.response = RPCResponse.codec().decode(reader, reader.uint32());
                            break;
                        default:
                            reader.skipType(tag & 7);
                            break;
                    }
                }
                return obj;
            });
        }
        return _codec;
    };
    RPCMessage.encode = (obj) => {
        return encodeMessage(obj, RPCMessage.codec());
    };
    RPCMessage.decode = (buf) => {
        return decodeMessage(buf, RPCMessage.codec());
    };
})(RPCMessage || (RPCMessage = {}));
