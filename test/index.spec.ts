import { createRSAPeerId } from "@libp2p/peer-id-factory";
import { mockRegistrar, mockConnectionManager, mockNetwork } from "@libp2p/interface-mocks";
import { start } from "@libp2p/interfaces/startable";
import { stubInterface } from "ts-sinon";
import type { PeerId } from "@libp2p/interface-peer-id";
import type { ConnectionManager } from "@libp2p/interface-connection-manager";
import { RPCComponents, RPC, createRPC } from "../src/index.js";

const createComponents = async (): Promise<RPCComponents & { peerId: PeerId }> => {
	const components: RPCComponents & { peerId: PeerId } = {
		peerId: await createRSAPeerId({ bits: 512 }),
		registrar: mockRegistrar(),
		connectionManager: stubInterface<ConnectionManager>()
	};

	components.connectionManager = mockConnectionManager(components);

	await start(...Object.entries(components));

	mockNetwork.addNode(components);

	return components;
};

let localComponents: RPCComponents & { peerId: PeerId };
let localRpc: RPC;
let remoteComponents: RPCComponents & { peerId: PeerId };
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

describe("rpc", () => {
	beforeEach(async () => {
		await localRpc.start();
		await remoteRpc.start();

		await remoteComponents.connectionManager.openConnection(localComponents.peerId);
	});

	afterEach(async () => {
		await Promise.all(localComponents.connectionManager.getConnections().map(c => c.close()));
		await Promise.all(remoteComponents.connectionManager.getConnections().map(c => c.close()));
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
