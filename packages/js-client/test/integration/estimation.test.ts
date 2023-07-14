import { SimpleStorageClient, SimpleStorageContext } from "../../src";
import { contextParamsLocalChain } from "../constants";
import * as ganacheSetup from "../helpers/ganache-setup";
import * as deployContracts from "../helpers/deploy-contracts";
import { Server } from "ganache";
import { buildSimpleStorageDao } from "../helpers/build-daos";
import { ContextCore, LIVE_CONTRACTS, SupportedNetworksArray } from "@aragon/sdk-client-common";
import { JsonRpcProvider } from "@ethersproject/providers";

jest.spyOn(SupportedNetworksArray, "includes").mockReturnValue(true);
jest.spyOn(ContextCore.prototype, "network", "get").mockReturnValue(
  { chainId: 5, name: "goerli" },
);

describe("Estimation", () => {
  let server: Server;
  let deployment: deployContracts.Deployment;
  let dao: { dao: string; plugins: string[] };
  beforeAll(async () => {
    server = await ganacheSetup.start();
    deployment = await deployContracts.deploy();
    dao = await buildSimpleStorageDao(deployment);
    contextParamsLocalChain.simpleStorageRepoAddress =
      deployment.simpleStorageRepo.address;
    contextParamsLocalChain.simpleStoragePluginAddress = dao!.plugins[0];
    contextParamsLocalChain.ensRegistryAddress = deployment.ensRegistry.address;
    LIVE_CONTRACTS.goerli.pluginSetupProcessor = deployment.pluginSetupProcessor.address;
  });

  afterAll(async () => {
    server.close();
  });

  it("Should estimate the gas fees for prepareing an installation", async () => {
    const context = new SimpleStorageContext(contextParamsLocalChain);
    const client = new SimpleStorageClient(context);
    const networkSpy = jest.spyOn(JsonRpcProvider.prototype, "getNetwork");
    const defaultGetNetworkImplementation = networkSpy
      .getMockImplementation();
    networkSpy.mockImplementation(() =>
      Promise.resolve({
        name: "goerli",
        chainId: 31337,
      })
    );
    const estimation = await client.estimation.prepareInstallation({
      daoAddressOrEns: dao.dao,
      settings: { number: BigInt(1) },
    });
    expect(estimation.average).toBeGreaterThan(0);
    expect(estimation.max).toBeGreaterThan(0);
    expect(estimation.max).toBeGreaterThan(estimation.average);
    networkSpy.mockImplementation(defaultGetNetworkImplementation);
  });
});
