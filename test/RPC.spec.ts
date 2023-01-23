import { createRSAPeerId } from "@libp2p/peer-id-factory";
import { mockRegistrar, mockConnectionManager, mockNetwork } from "@libp2p/interface-mocks";
import { start } from "@libp2p/interfaces/startable";
import { stubInterface } from "ts-sinon";
import type { PeerId } from "@libp2p/interface-peer-id";
import type { ConnectionManager } from "@libp2p/interface-connection-manager";
import type { Libp2p } from "@libp2p/interface-libp2p";
import { RPCComponents, RPC, createRPC } from "../src/index.js";

interface TestRPCComponents extends RPCComponents {
	peerId: PeerId
	dial: Libp2p["dial"]
}

const createComponents = async (): Promise<TestRPCComponents> => {
	const oldComponents = {
		peerId: await createRSAPeerId({ bits: 512 }),
		registrar: mockRegistrar(),
		connectionManager: stubInterface<ConnectionManager>() as ConnectionManager
	};

	oldComponents.connectionManager = mockConnectionManager(oldComponents);

	const components: TestRPCComponents = {
		peerId: oldComponents.peerId,
		dial: (peerId) => oldComponents.connectionManager.openConnection(peerId),
		handle: (protocol: string, handler) => oldComponents.registrar.handle(protocol, handler),
		unhandle: (protocol: string) => oldComponents.registrar.unhandle(protocol),
		getConnections: () => oldComponents.connectionManager.getConnections()
	};

	await start(...Object.entries(components));

	mockNetwork.addNode(oldComponents);

	return components;
};

let localComponents: TestRPCComponents;
let localRpc: RPC;
let remoteComponents: TestRPCComponents;
let remoteRpc: RPC;

beforeEach(async () => {
	localComponents = await createComponents();
	localRpc = createRPC()(localComponents);
	remoteComponents = await createComponents();
	remoteRpc = createRPC()(remoteComponents);
});

afterEach(async () => {
	await localRpc.stop();
	await remoteRpc.stop();
});

describe("startable interface", () => {
	it("is not started after creation", async () => {
		expect(localRpc.isStarted()).toBe(false);
	});

	it("starts", async () => {
		await localRpc.start();

		expect(localRpc.isStarted()).toBe(true);
	});

	it("stops", async () => {
		await localRpc.start();
		await localRpc.stop();

		expect(localRpc.isStarted()).toBe(false);
	});
});

describe("methods", () => {
	it("adds methods", () => {
		const method = "test";

		// Check something hasn't persisted at the start.
		expect(localRpc.hasMethod(method)).toBe(false);

		localRpc.addMethod(method, () => {});

		expect(localRpc.hasMethod(method)).toBe(true);
	});

	it("removes methods", () => {
		const method = "test";

		// Check something hasn't persisted at the start.
		expect(localRpc.hasMethod(method)).toBe(false);

		localRpc.addMethod(method, () => {});
		localRpc.removeMethod(method);

		expect(localRpc.hasMethod(method)).toBe(false);
	});
});

describe("rpc", () => {
	beforeEach(async () => {
		await localRpc.start();
		await remoteRpc.start();

		await remoteComponents.dial(localComponents.peerId);
	});

	afterEach(async () => {
		await Promise.all(localComponents.getConnections().map(c => c.close()));
		await Promise.all(remoteComponents.getConnections().map(c => c.close()));
	});

	it("calls the handler method on notifications", async () => {
		const params = new Uint8Array([1, 2, 3]);

		const dataPromise: Promise<{ params: Uint8Array, sender: PeerId }> = new Promise(resolve => {
			localRpc.addMethod("test", (params: Uint8Array, sender: PeerId) => {
				resolve({ params, sender });
			});
		});

		remoteRpc.notify(localComponents.peerId, "test", params);

		const data = await dataPromise;

		expect(data.sender.equals(remoteComponents.peerId)).toBe(true);
		expect(data.params).toStrictEqual(params);
	});

	it("calls the handler method on requests and returns the result", async () => {
		const params = new Uint8Array([1, 2, 3]);
		const response = new Uint8Array([2, 3, 4]);

		const dataPromise: Promise<{ params: Uint8Array, sender: PeerId }> = new Promise(resolve => {
			localRpc.addMethod("test", (params: Uint8Array, sender: PeerId) => {
				resolve({ params, sender });

				return response;
			});
		});

		const methodResponse = await remoteRpc.request(localComponents.peerId, "test", params);

		const data = await dataPromise;

		expect(data.sender.equals(remoteComponents.peerId)).toBe(true);
		expect(data.params).toStrictEqual(params);
		expect(methodResponse).toStrictEqual(response);
	});
});
