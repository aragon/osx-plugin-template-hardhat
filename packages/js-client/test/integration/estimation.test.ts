import { MyPluginClient, MyPluginContext } from '../../src';
import { contextParamsLocalChain } from '../constants';
import { buildMyPluginDao } from '../helpers/build-daos';
import * as deployContracts from '../helpers/deploy-contracts';
import {
  ContextCore,
  LIVE_CONTRACTS,
  SupportedNetworksArray,
} from '@aragon/sdk-client-common';
// @ts-ignore Needed to get the global typing for hardhat
import * as jestenv from "jest-environment-hardhat"

jest.spyOn(SupportedNetworksArray, 'includes').mockReturnValue(true);
jest
  .spyOn(ContextCore.prototype, 'network', 'get')
  .mockReturnValue({ chainId: 5, name: 'goerli' });

describe('Estimation', () => {
  let deployment: deployContracts.Deployment;
  let dao: { dao: string; plugins: string[] };
  beforeAll(async () => {
    deployment = await deployContracts.deploy();
    dao = await buildMyPluginDao(deployment);
    contextParamsLocalChain.myPluginRepoAddress =
      deployment.myPluginRepo.address;
    contextParamsLocalChain.myPluginPluginAddress = dao!.plugins[0];
    contextParamsLocalChain.ensRegistryAddress = deployment.ensRegistry.address;
    LIVE_CONTRACTS.goerli.pluginSetupProcessor =
      deployment.pluginSetupProcessor.address;

    // set the correct rpc endpoint for tests
    contextParamsLocalChain.web3Providers = [hardhat.url]
  });

  afterAll(async () => {
    await hardhat.provider.send("hardhat_reset", [])
  });

  it('Should estimate the gas fees for prepareing an ainstallation', async () => {
    const context = new MyPluginContext(contextParamsLocalChain);
    const client = new MyPluginClient(context);
    const estimation = await client.estimation.prepareInstallation({
      daoAddressOrEns: dao.dao,
      settings: { number: BigInt(1) },
    });
    expect(estimation.average).toBeGreaterThan(0);
    expect(estimation.max).toBeGreaterThan(0);
    expect(estimation.max).toBeGreaterThan(estimation.average);
  });
});
