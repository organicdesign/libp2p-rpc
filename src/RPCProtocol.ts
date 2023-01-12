/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */

import { encodeMessage, decodeMessage, message } from 'protons-runtime'
import type { Uint8ArrayList } from 'uint8arraylist'
import type { Codec } from 'protons-runtime'

export interface RPCRequest {
  name: string
  params?: Uint8Array
  id?: number
}

export namespace RPCRequest {
  let _codec: Codec<RPCRequest>

  export const codec = (): Codec<RPCRequest> => {
    if (_codec == null) {
      _codec = message<RPCRequest>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (opts.writeDefaults === true || obj.name !== '') {
          w.uint32(10)
          w.string(obj.name)
        }

        if (obj.params != null) {
          w.uint32(18)
          w.bytes(obj.params)
        }

        if (obj.id != null) {
          w.uint32(24)
          w.uint32(obj.id)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length) => {
        const obj: any = {
          name: ''
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1:
              obj.name = reader.string()
              break
            case 2:
              obj.params = reader.bytes()
              break
            case 3:
              obj.id = reader.uint32()
              break
            default:
              reader.skipType(tag & 7)
              break
          }
        }

        return obj
      })
    }

    return _codec
  }

  export const encode = (obj: RPCRequest): Uint8Array => {
    return encodeMessage(obj, RPCRequest.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList): RPCRequest => {
    return decodeMessage(buf, RPCRequest.codec())
  }
}

export interface RPCError {
  code: number
  message: string
  data?: Uint8Array
}

export namespace RPCError {
  let _codec: Codec<RPCError>

  export const codec = (): Codec<RPCError> => {
    if (_codec == null) {
      _codec = message<RPCError>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (opts.writeDefaults === true || obj.code !== 0) {
          w.uint32(8)
          w.int32(obj.code)
        }

        if (opts.writeDefaults === true || obj.message !== '') {
          w.uint32(18)
          w.string(obj.message)
        }

        if (obj.data != null) {
          w.uint32(26)
          w.bytes(obj.data)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length) => {
        const obj: any = {
          code: 0,
          message: ''
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1:
              obj.code = reader.int32()
              break
            case 2:
              obj.message = reader.string()
              break
            case 3:
              obj.data = reader.bytes()
              break
            default:
              reader.skipType(tag & 7)
              break
          }
        }

        return obj
      })
    }

    return _codec
  }

  export const encode = (obj: RPCError): Uint8Array => {
    return encodeMessage(obj, RPCError.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList): RPCError => {
    return decodeMessage(buf, RPCError.codec())
  }
}

export interface RPCResponse {
  id: number
  result?: Uint8Array
  error?: RPCError
}

export namespace RPCResponse {
  let _codec: Codec<RPCResponse>

  export const codec = (): Codec<RPCResponse> => {
    if (_codec == null) {
      _codec = message<RPCResponse>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (opts.writeDefaults === true || obj.id !== 0) {
          w.uint32(8)
          w.uint32(obj.id)
        }

        if (obj.result != null) {
          w.uint32(18)
          w.bytes(obj.result)
        }

        if (obj.error != null) {
          w.uint32(26)
          RPCError.codec().encode(obj.error, w, {
            writeDefaults: false
          })
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length) => {
        const obj: any = {
          id: 0
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1:
              obj.id = reader.uint32()
              break
            case 2:
              obj.result = reader.bytes()
              break
            case 3:
              obj.error = RPCError.codec().decode(reader, reader.uint32())
              break
            default:
              reader.skipType(tag & 7)
              break
          }
        }

        return obj
      })
    }

    return _codec
  }

  export const encode = (obj: RPCResponse): Uint8Array => {
    return encodeMessage(obj, RPCResponse.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList): RPCResponse => {
    return decodeMessage(buf, RPCResponse.codec())
  }
}

export interface RPCMessage {
  request?: RPCRequest
  response?: RPCResponse
}

export namespace RPCMessage {
  let _codec: Codec<RPCMessage>

  export const codec = (): Codec<RPCMessage> => {
    if (_codec == null) {
      _codec = message<RPCMessage>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if (obj.request != null) {
          w.uint32(10)
          RPCRequest.codec().encode(obj.request, w, {
            writeDefaults: false
          })
        }

        if (obj.response != null) {
          w.uint32(18)
          RPCResponse.codec().encode(obj.response, w, {
            writeDefaults: false
          })
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length) => {
        const obj: any = {}

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1:
              obj.request = RPCRequest.codec().decode(reader, reader.uint32())
              break
            case 2:
              obj.response = RPCResponse.codec().decode(reader, reader.uint32())
              break
            default:
              reader.skipType(tag & 7)
              break
          }
        }

        return obj
      })
    }

    return _codec
  }

  export const encode = (obj: RPCMessage): Uint8Array => {
    return encodeMessage(obj, RPCMessage.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList): RPCMessage => {
    return decodeMessage(buf, RPCMessage.codec())
  }
}
