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

// Call the 'log' method on the peer with ID peerId with parameter.
await rpc.request(peerId, "log", new Uint8Array([1]));

// Call the 'log' method without expecting a response.
rpc.notify(peerId, "log", new Uint8Array([2]));

// Stop the rpc module.
await rpc.stop();
```

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
