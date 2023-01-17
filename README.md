# libp2p-rpc

An RPC module for Libp2p.

## Install

```
npm i @organicdesign/libp2p-rpc
```

## Usage

```javascript
import { createRPC } from "@organicdesign/libp2p-rpc";

const rpc = createRPC([options])(libp2p);

// Add an RPC method.
rpc.addMethod("log", (params, peerId) => {
	console.log(`received ${message} from ${peerId.toString()}`);
});

// Start the rpc module.
await rpc.start();

// Call the 'log' method on the connected peer with ID peerId with parameter.
await rpc.request(peerId, "log", new Uint8Array([1]));

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
  - `timeout` `<number>` The timeout in milliseconds for requests. Default: 5000 (5s)
- `libp2p` `<Libp2p>` The libp2p instance.
- Returns: `<RPC>` The RPC instance.

Creates a Libp2p RPC module.

### RPC

```javascript
createRPC(libp2p, [options]);
```

- `options` `<Object>` An optional object with the following properties:
  - `protocol` `<string>` A string which specifies the name of the protocol. Default: `"/libp2p-rpc/0.0.1"`.
  - `timeout` `<number>` The timeout in milliseconds for requests. Default: 5000 (5s)
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

Request a remote peer to execute a method. The promise resolves with the result of the RPC method or rejects with an error if the method fails or it fails to send the request (the peer is not connected) or it times out.

#### notify

```javascript
rpc.notify(peerId, name, [params]);
```

- `peerId` `<PeerId>` The ID of the peer to request the call on.
- `name` `<string>` The name of the method to execute.
- `params` `<Uint8Array>` The paramters to call the method with.

Request a remote peer to execute a method. This executes synchronously, does not return any value and will not throw even if it fails to send the request.

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
