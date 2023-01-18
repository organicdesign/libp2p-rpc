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

let messageHandler: RPC, components: RPCComponents & { peerId: PeerId };

beforeEach(async () => {
	components = await createComponents();
	messageHandler = createRPC()(components);
});

describe("startable interface", () => {
	it("is not started after creation", async () => {
		expect(messageHandler.isStarted()).toBe(false);
	});

	it("starts", async () => {
		await messageHandler.start();

		expect(messageHandler.isStarted()).toBe(true);
	});

	it("stops", async () => {
		await messageHandler.start();
		await messageHandler.stop();

		expect(messageHandler.isStarted()).toBe(false);
	});
});
