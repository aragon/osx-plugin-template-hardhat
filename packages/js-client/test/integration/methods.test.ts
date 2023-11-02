
import * as mockedGraphqlRequest from '../mocks/graphql-request';
import {
  NumbersQueryParams,
  NumbersSortBy,
  MyPluginClient,
  MyPluginContext,
} from '../../src';
import { QueryNumber, QueryNumbers } from '../../src/internal/graphql-queries';
import {
  SubgraphNumber,
  SubgraphNumberListItem,
} from '../../src/internal/types';
import { contextParamsLocalChain } from '../constants';
import { buildMyPluginDao } from '../helpers/build-daos';
import * as deployContracts from '../helpers/deploy-contracts';
import {
  ContextCore,
  LIVE_CONTRACTS,
  PrepareInstallationStep,
  SortDirection,
  SupportedNetworksArray,
} from '@aragon/sdk-client-common';
// @ts-ignore Needed to get the global typing for hardhat
import * as jestenv from "jest-environment-hardhat"

jest.spyOn(SupportedNetworksArray, 'includes').mockReturnValue(true);
jest
  .spyOn(ContextCore.prototype, 'network', 'get')
  .mockReturnValue({ chainId: 5, name: 'goerli' });

describe('Methods', () => {
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

  it('Should prepare an installation', async () => {
    const context = new MyPluginContext(contextParamsLocalChain);
    const client = new MyPluginClient(context);
    const steps = client.methods.prepareInstallation({
      daoAddressOrEns: dao.dao,
      settings: { number: BigInt(1) },
    });
    for await (const step of steps) {
      switch (step.key) {
        case PrepareInstallationStep.PREPARING:
          expect(step.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
          break;
        case PrepareInstallationStep.DONE:
          expect(typeof step.pluginAddress).toBe('string');
          expect(step.pluginAddress).toMatch(/^0x[A-Fa-f0-9]{40}$/i);
          expect(typeof step.pluginRepo).toBe('string');
          expect(step.pluginRepo).toMatch(/^0x[A-Fa-f0-9]{40}$/i);
          expect(Array.isArray(step.helpers)).toBe(true);
          for (const helper of step.helpers) {
            expect(typeof helper).toBe('string');
          }
          expect(Array.isArray(step.permissions)).toBe(true);
          for (const permission of step.permissions) {
            expect(typeof permission.condition).toBe('string');
            if (permission.condition) {
              expect(permission.condition).toMatch(/^0x[A-Fa-f0-9]{40}$/i);
            }
            expect(typeof permission.operation).toBe('number');
            expect(typeof permission.where).toBe('string');
            expect(permission.where).toMatch(/^0x[A-Fa-f0-9]{40}$/i);
            expect(typeof permission.who).toBe('string');
            expect(permission.who).toMatch(/^0x[A-Fa-f0-9]{40}$/i);
          }
          expect(typeof step.versionTag.build).toBe('number');
          expect(typeof step.versionTag.release).toBe('number');
          break;
      }
    }
  });

  it('Should get a number', async () => {
    const context = new MyPluginContext(contextParamsLocalChain);
    const client = new MyPluginClient(context);
    const mockedClient = mockedGraphqlRequest.getMockedInstance(
      client.graphql.getClient()
    );
    const subgraphResponse: SubgraphNumber = {
      number: {
        value: '1',
      },
    };
    mockedClient.request.mockResolvedValueOnce({
      dao: subgraphResponse,
    });

    const number = await client.methods.getNumber(dao.dao);

    expect(number.toString()).toBe('1');

    expect(mockedClient.request).toHaveBeenCalledWith(QueryNumber, {
      id: dao.dao,
    });
  });

  it('Should get a list of numbers', async () => {
    const context = new MyPluginContext(contextParamsLocalChain);
    const client = new MyPluginClient(context);
    const mockedClient = mockedGraphqlRequest.getMockedInstance(
      client.graphql.getClient()
    );
    const limit = 5;
    const params: NumbersQueryParams = {
      limit,
      sortBy: NumbersSortBy.CREATED_AT,
      direction: SortDirection.ASC,
      skip: 0,
    };
    const subgraphResponse: SubgraphNumberListItem[] = [
      {
        id: dao.dao,
        subdomain: 'test',
        number: {
          value: '1',
        },
      },
    ];
    mockedClient.request.mockResolvedValueOnce({
      daos: subgraphResponse,
    });

    const numbers = await client.methods.getNumbers(params);

    for (const [index, subgraphNumber] of subgraphResponse.entries()) {
      expect(subgraphNumber.id).toBe(numbers[index].id);
      expect(subgraphNumber.subdomain).toBe(numbers[index].subdomain);
      expect(subgraphNumber.number.value).toBe(numbers[index].value.toString());
    }

    expect(mockedClient.request).toHaveBeenCalledWith(QueryNumbers, params);
  });
});
