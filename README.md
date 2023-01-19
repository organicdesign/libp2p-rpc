# libp2p-rpc

An RPC module for Libp2p.

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [API](#api)
  - [createRPC](#createrpc)
  - [RPC](#rpc)
    - [start](#start)
    - [stop](#stop)
    - [addMethod](#addmethod)
    - [request](#request)
    - [notify](#notify)
  - [RPCException](#rpcexception)
- [Logging](#logging)
- [Tests](#tests)
- [Protocol Design](#protocol-design)
- [To-Do](#to-do)

## Install

```
npm i @organicdesign/libp2p-rpc
```

## Usage

```javascript
import { createRPC, RPCException } from "@organicdesign/libp2p-rpc";

const rpc = createRPC([options])(libp2p);

// Add an RPC method.
rpc.addMethod("log", (params, peerId) => {
	console.log(`received ${params} from ${peerId.toString()}`);

	const somethingHasGoneWrong = false;

	if (somethingHasGoneWrong) {
		// Respond with an error with a message and code.
		throw new RPCException("Something went wrong", 0);
	}

	// Return a response
	return new Uint8Array([3]);
});

// Start the rpc module.
await rpc.start();

// Call the 'log' method on the connected peer with ID peerId with parameter.
const response = await rpc.request(peerId, "log", new Uint8Array([1]));

console.log("Response: ", response); // Response:  Uint8Array [ 3 ]

// Call the 'log' method without expecting a response.
rpc.notify(peerId, "log", new Uint8Array([2]));

// Stop the rpc module.
await rpc.stop();
```

## API

### createRPC

```javascript
createRPC([options])(libp2p);
```

- `options` `<Object>` An optional object with the following properties:
  - `protocol` `<string>` A string which specifies the name of the protocol. Default: `"/libp2p-rpc/0.0.1"`.
  - `timeout` `<number>` The timeout in milliseconds for requests. Set to `-1` to disable. Default: `5000` (5s)
- `libp2p` `<Libp2p>` The libp2p instance.
- Returns: `<RPC>` The RPC instance.

Creates a Libp2p RPC module.

### RPC

```javascript
createRPC(libp2p, [options]);
```

- `options` `<Object>` An optional object with the following properties:
  - `protocol` `<string>` A string which specifies the name of the protocol. Default: `"/libp2p-rpc/0.0.1"`.
  - `timeout` `<number>` The timeout in milliseconds for requests. Set to `-1` to disable. Default: `5000` (5s)
- `libp2p` `<Libp2p>` The libp2p instance.

The RPC class. It is not recommended to instanciate it directly but rather use the `createRPC` function.

#### start

```javascript
rpc.start();
```

- Returns: `<Promise>`

Start the RPC module, resolves when it has finished starting.

#### stop

```javascript
rpc.stop();
```

- Returns: `<Promise>`

Stop the RPC module, resolves when it has finished stopping.

#### addMethod

```javascript
rpc.addMethod(name, method);
```

- `name` `<string>` The name of the method to add.
- `method` `<RPCMethod>` The RPC method to add. RPCMethod is a method with the parameters:
  - `params` `<Uint8Array> | <undefined>` The paramters this method was called with.
  - `sender` `<PeerId>` The peer that called this method.

Add a remote procedure call method.

#### request

```javascript
rpc.request(peerId, name, [params]);
```

- `peerId` `<PeerId>` The ID of the peer to request the call on.
- `name` `<string>` The name of the method to execute.
- `params` `<Uint8Array>` The paramters to call the method with.
- Returns: `<Promise>`

Request a remote peer to execute a method. The promise resolves with the result of the RPC method or rejects with an `RPCException` if the method fails or it fails to send the request (the peer is not connected) or it times out.

#### notify

```javascript
rpc.notify(peerId, name, [params]);
```

- `peerId` `<PeerId>` The ID of the peer to request the call on.
- `name` `<string>` The name of the method to execute.
- `params` `<Uint8Array>` The paramters to call the method with.

Request a remote peer to execute a method. This executes synchronously, does not return any value and will not throw even if it fails to send the request.

### RPCException

```javascript
new RPCException(message, code, [data]);
```

- `message` `<string>` The error message.
- `code` `<number>` The error code.
- `data` `<Uint8Array>` Optional error data.

The `RPCException` class is an extention of the native `Error` class with additional properties to hold an error code and error data. You can throw `RPCException`s inside RPC methods to return additional data back to the remote caller.

The pre-defined error codes are:

- `-32601` `Method not found` Thrown when a method is called on a node that does not have a matching handler.
- `-32000` Thrown when the request could not be sent to the remote peer. The message is not static and is the reason why the request message could not be sent. This can be caused by not being connected to it.
- `-32001` `RPC module stopped` Thrown when a request is aborted due to the module stopping.
- `-32002` Thrown when the method throws an error but does not define a code. The message is not static and is the message of the error that was thrown.
- `-32003` `Request timed out` Thrown when a request timed out.

## Logging

The logger has the following namespaces:

* `libp2p:rpc` - Logs general actions like starting, stopping and incoming/outgoing rpc calls.

To enable logging in nodejs add the following environment variable (by prefixing the start command):

```
DEBUG=libp2p:rpc*
```

Or in the browser:

```javascript
localStorage.setItem("debug", "libp2p:rpc*");
```

## Protocol Design

This module is loosely based on the [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification) but altered to work efficiently over libp2p.

The parameters are bytes instead of an object or array, the response is also bytes and all the fields are encoded into binary using protocol buffers instead of JSON.

## Tests

To run the test suite:

```
npm run test
```

## To-Do

- [ ] Add tests.
