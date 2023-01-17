# libp2p-rpc

An RPC module for Libp2p.

## Install

```
npm i @organicdesign/libp2p-rpc
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
