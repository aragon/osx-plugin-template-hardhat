import { SimpleStorageClient, SimpleStorageContext } from '../../src';
import { contextParamsLocalChain } from '../constants';
import { buildSimpleStorageDao } from '../helpers/build-daos';
import * as deployContracts from '../helpers/deploy-contracts';
import * as ganacheSetup from '../helpers/ganache-setup';
import { ContextCore, SupportedNetworksArray } from '@aragon/sdk-client-common';
import { hexToBytes } from '@aragon/sdk-common';
import { Server } from 'ganache';

jest.spyOn(SupportedNetworksArray, 'includes').mockReturnValue(true);
jest
  .spyOn(ContextCore.prototype, 'network', 'get')
  .mockReturnValue({ chainId: 5, name: 'goerli' });

describe('Decoding', () => {
  let server: Server;
  let deployment: deployContracts.Deployment;
  beforeAll(async () => {
    server = await ganacheSetup.start();
    deployment = await deployContracts.deploy();
    const dao = await buildSimpleStorageDao(deployment);
    contextParamsLocalChain.simpleStorageRepoAddress =
      deployment.simpleStorageRepo.address;
    contextParamsLocalChain.simpleStoragePluginAddress = dao!.plugins[0];
    contextParamsLocalChain.ensRegistryAddress = deployment.ensRegistry.address;
  });

  afterAll(async () => {
    server.close();
  });

  it('should decode an action', async () => {
    const ctx = new SimpleStorageContext(contextParamsLocalChain);
    const client = new SimpleStorageClient(ctx);
    const data = hexToBytes(
      '0xb63394180000000000000000000000000000000000000000000000000000000000000002'
    );
    const decodedNum = client.decoding.storeNumberAction(data);
    expect(decodedNum).toBe(BigInt(2));
  });
});
