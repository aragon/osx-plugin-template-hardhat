import { SimpleStorageClient, SimpleStorageContext } from '../../src';
import { contextParamsLocalChain } from '../constants';
import { buildSimpleStorageDao } from '../helpers/build-daos';
import * as deployContracts from '../helpers/deploy-contracts';
import * as ganacheSetup from '../helpers/ganache-setup';
import { ContextCore, SupportedNetworksArray } from '@aragon/sdk-client-common';
import { Server } from 'ganache';

jest.spyOn(SupportedNetworksArray, 'includes').mockReturnValue(true);
jest
  .spyOn(ContextCore.prototype, 'network', 'get')
  .mockReturnValue({ chainId: 5, name: 'goerli' });

describe('Encoding', () => {
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

  it('should encode an action', async () => {
    const ctx = new SimpleStorageContext(contextParamsLocalChain);
    const client = new SimpleStorageClient(ctx);
    const num = BigInt(2);
    const action = client.encoding.storeNumberAction(num);
    expect(action.to).toBe(contextParamsLocalChain.simpleStoragePluginAddress);
    expect(action.data instanceof Uint8Array).toBe(true);
    expect(action.data.length).toBeGreaterThan(0);
    const decodedNum = client.decoding.storeNumberAction(action.data);
    expect(decodedNum).toBe(num);
  });
});
