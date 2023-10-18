import {MyPluginContext} from '../../src';
import {MyPluginContextParams} from '../../src/types';
import {ADDRESS_ONE} from '../constants';
import {
  Context,
  GRAPHQL_NODES,
  IPFS_NODES,
  LIVE_CONTRACTS,
} from '@aragon/sdk-client-common';
import {Client as IpfsClient} from '@aragon/sdk-ipfs';
import {JsonRpcProvider} from '@ethersproject/providers';
import {Wallet} from '@ethersproject/wallet';
import {GraphQLClient} from 'graphql-request';

describe('Context instances', () => {
  let contextParams: MyPluginContextParams;
  const TEST_WALLET =
    '8d7d56a9efa4158d232edbeaae601021eb3477ad77b5f3c720601fd74e8e04bb';
  const web3endpoints = {
    working: ['https://cloudflare-eth.com/'],
    failing: ['https://bad-url-gateway.io/'],
  };
  beforeEach(() => {
    // reset contextParams
    contextParams = {
      // General parameters
      network: 'mainnet',
      signer: new Wallet(TEST_WALLET),
      daoFactoryAddress: '0x1234',
      web3Providers: web3endpoints.working,
      gasFeeEstimationFactor: 0.1,
      graphqlNodes: [],
      ipfsNodes: [],
      // Plugin specific parameters
      myPluginPluginAddress: 'notDefault',
    };
  });
  it('Should create an empty context and have default values', () => {
    const context = new MyPluginContext();
    expect(context).toBeInstanceOf(MyPluginContext);
    expect(context.network.name).toBe('homestead');
    expect(context.network.chainId).toBe(1);
    expect(context.daoFactoryAddress).toBe(LIVE_CONTRACTS.homestead.daoFactory);
    expect(context.ensRegistryAddress).toBe(context.network.ensAddress);
    expect(context.gasFeeEstimationFactor).toBe(0.625);
    expect(context.web3Providers.length).toBe(0);
    expect(context.ipfs.length).toBe(IPFS_NODES.homestead.length);
    expect(context.graphql.length).toBe(GRAPHQL_NODES.homestead.length);
    expect(context.myPluginPluginAddress).toBe(
      '0x2345678901234567890123456789012345678901'
    );
    context.web3Providers.map(provider => {
      expect(provider).toBeInstanceOf(JsonRpcProvider);
    });
    context.ipfs.map(ipfsClient => {
      expect(ipfsClient).toBeInstanceOf(IpfsClient);
    });
    context.graphql.map(graphqlClient =>
      expect(graphqlClient).toBeInstanceOf(GraphQLClient)
    );
  });
  it('Should create a context and have the correct values', () => {
    const context = new MyPluginContext(contextParams);

    expect(context).toBeInstanceOf(MyPluginContext);
    expect(context.network.name).toBe('homestead');
    expect(context.network.chainId).toBe(1);
    expect(context.daoFactoryAddress).toBe(contextParams.daoFactoryAddress);
    expect(context.ensRegistryAddress).toBe(context.network.ensAddress);
    expect(context.gasFeeEstimationFactor).toBe(
      contextParams.gasFeeEstimationFactor
    );
    context.web3Providers.map(provider =>
      expect(provider).toBeInstanceOf(JsonRpcProvider)
    );
    context.ipfs.map(ipfsClient =>
      expect(ipfsClient).toBeInstanceOf(IpfsClient)
    );
    context.graphql.map(graphqlClient =>
      expect(graphqlClient).toBeInstanceOf(GraphQLClient)
    );
    expect(context.myPluginPluginAddress).toBe('notDefault');
  });
  it('Should set a new context and have the correct values', () => {
    const context = new MyPluginContext(contextParams);
    contextParams = {
      network: 'goerli',
      signer: new Wallet(TEST_WALLET),
      daoFactoryAddress: '0x2345',
      web3Providers: web3endpoints.working,
      gasFeeEstimationFactor: 0.1,
      ipfsNodes: [{url: 'https://localhost', headers: {}}],
      graphqlNodes: [{url: 'https://localhost'}],
      myPluginPluginAddress: 'notDefault',
    };
    context.set(contextParams);

    expect(context).toBeInstanceOf(MyPluginContext);
    expect(context.network.name).toEqual('goerli');
    expect(context.network.chainId).toEqual(5);
    expect(context.signer).toBeInstanceOf(Wallet);
    expect(context.daoFactoryAddress).toEqual('0x2345');
    context.web3Providers?.map(provider =>
      expect(provider).toBeInstanceOf(JsonRpcProvider)
    );
    context.ipfs?.map(ipfsClient =>
      expect(ipfsClient).toBeInstanceOf(IpfsClient)
    );
    context.graphql?.map(graphqlClient =>
      expect(graphqlClient).toBeInstanceOf(GraphQLClient)
    );
    expect(context.gasFeeEstimationFactor).toEqual(0.1);
    expect(context.myPluginPluginAddress).toBe('notDefault');
  });
  it('Should create a context in goerli, update the network and update all the parameters automatically', () => {
    const context = new MyPluginContext({
      network: 'goerli',
      web3Providers: 'https://eth-goerli.g.alchemy.com/v2/demo',
    });
    expect(context).toBeInstanceOf(MyPluginContext);
    expect(context.network.name).toBe('goerli');
    expect(context.network.chainId).toBe(5);
    expect(context.daoFactoryAddress).toBe(LIVE_CONTRACTS.goerli.daoFactory);
    expect(context.ensRegistryAddress).toBe(context.network.ensAddress);
    expect(context.gasFeeEstimationFactor).toBe(0.625);
    expect(context.web3Providers.length).toBe(1);
    expect(context.ipfs.length).toBe(IPFS_NODES.goerli.length);
    expect(context.graphql.length).toBe(GRAPHQL_NODES.goerli.length);
    context.web3Providers.map(provider => {
      expect(provider).toBeInstanceOf(JsonRpcProvider);
    });
    context.ipfs.map(ipfsClient => {
      expect(ipfsClient).toBeInstanceOf(IpfsClient);
    });
    context.graphql.map(graphqlClient =>
      expect(graphqlClient).toBeInstanceOf(GraphQLClient)
    );

    expect(context.myPluginPluginAddress).toBe(
      '0x2345678901234567890123456789012345678901'
    );
    context.set({
      network: 'matic',
      web3Providers: 'https://polygon-rpc.com/',
      myPluginPluginAddress: 'otherValue',
    });
    expect(context.network.name).toBe('matic');
    expect(context.network.chainId).toBe(137);
    expect(context.daoFactoryAddress).toBe(LIVE_CONTRACTS.matic.daoFactory);
    expect(context.ensRegistryAddress).toBe(LIVE_CONTRACTS.matic.ensRegistry);
    expect(context.gasFeeEstimationFactor).toBe(0.625);
    expect(context.web3Providers.length).toBe(1);
    expect(context.ipfs.length).toBe(IPFS_NODES.matic.length);
    expect(context.graphql.length).toBe(GRAPHQL_NODES.matic.length);
    context.web3Providers.map(provider => {
      expect(provider).toBeInstanceOf(JsonRpcProvider);
    });
    context.ipfs.map(ipfsClient => {
      expect(ipfsClient).toBeInstanceOf(IpfsClient);
    });
    context.graphql.map(graphqlClient =>
      expect(graphqlClient).toBeInstanceOf(GraphQLClient)
    );
    expect(context.myPluginPluginAddress).toBe('otherValue');
  });
  it('Should create an empty context, update the network and update all the parameters automatically', () => {
    const context = new MyPluginContext();
    expect(context).toBeInstanceOf(MyPluginContext);
    context.set({
      network: 'matic',
      web3Providers: 'https://polygon-rpc.com/',
    });
    expect(context.network.name).toBe('matic');
    expect(context.network.chainId).toBe(137);
    expect(context.daoFactoryAddress).toBe(LIVE_CONTRACTS.matic.daoFactory);
    expect(context.ensRegistryAddress).toBe(LIVE_CONTRACTS.matic.ensRegistry);
    expect(context.gasFeeEstimationFactor).toBe(0.625);
    expect(context.web3Providers.length).toBe(1);
    expect(context.ipfs.length).toBe(IPFS_NODES.matic.length);
    expect(context.graphql.length).toBe(GRAPHQL_NODES.matic.length);
    context.web3Providers.map(provider => {
      expect(provider).toBeInstanceOf(JsonRpcProvider);
    });
    context.ipfs.map(ipfsClient => {
      expect(ipfsClient).toBeInstanceOf(IpfsClient);
    });
    context.graphql.map(graphqlClient =>
      expect(graphqlClient).toBeInstanceOf(GraphQLClient)
    );
  });
  it('Should Change the network and update all the parameters', () => {
    const context = new MyPluginContext();
    context.set({
      ensRegistryAddress: ADDRESS_ONE,
      graphqlNodes: [
        {
          url: 'https://example.com/1',
        },
        {
          url: 'https://example.com/2',
        },
        {
          url: 'https://example.com/3',
        },
      ],
    });
    // Make sure that the prvious propertis are not modified
    // with the networ change becaouse now they are on manual
    // mode
    context.set({network: 'matic'});
    expect(context).toBeInstanceOf(MyPluginContext);
    expect(context.network.name).toBe('matic');
    expect(context.network.chainId).toBe(137);
    expect(context.daoFactoryAddress).toBe(LIVE_CONTRACTS.matic.daoFactory);
    expect(context.ensRegistryAddress).toBe(ADDRESS_ONE);
    expect(context.gasFeeEstimationFactor).toBe(0.625);
    expect(context.web3Providers.length).toBe(0);
    expect(context.ipfs.length).toBe(IPFS_NODES.matic.length);
    expect(context.graphql.length).toBe(3);
    context.web3Providers.map(provider => {
      expect(provider).toBeInstanceOf(JsonRpcProvider);
    });
    context.ipfs.map(ipfsClient => {
      expect(ipfsClient).toBeInstanceOf(IpfsClient);
    });
    context.graphql.map(graphqlClient =>
      expect(graphqlClient).toBeInstanceOf(GraphQLClient)
    );
  });
  it('Should create a context with invalid network and fail', () => {
    contextParams.network = 'notexistingnetwork';

    expect(() => {
      new MyPluginContext(contextParams);
    }).toThrow();
  });
  it('Should create a context with invalid gas fee estimation factor and fail', () => {
    contextParams.gasFeeEstimationFactor = 1.1;

    expect(() => {
      new MyPluginContext(contextParams);
    }).toThrow();
  });
  it('Should create a context with the correct DAOFactory address from the core-contracts-package', () => {
    contextParams.daoFactoryAddress = '';
    contextParams.network = 'matic';
    const context = new MyPluginContext(contextParams);

    expect(context).toBeInstanceOf(MyPluginContext);
    expect(context.network.name).toEqual('matic');
    context.web3Providers?.map(provider =>
      provider.getNetwork().then(nw => {
        expect(nw.chainId).toEqual(137);
        expect(nw.name).toEqual('matic');
        expect(nw.ensAddress).toEqual(LIVE_CONTRACTS.matic.ensRegistry);
      })
    );
    expect(context.daoFactoryAddress).toEqual(LIVE_CONTRACTS.matic.daoFactory);
    expect(context.ensRegistryAddress).toEqual(
      LIVE_CONTRACTS.matic.ensRegistry
    );
  });

  it('it should use a context to initialize the MyPluginContext', () => {
    const context = new Context(contextParams);
    const myPluginContext = new MyPluginContext(
      {
        myPluginPluginAddress: 'notDefault',
      },
      context
    );
    expect(myPluginContext.network.name).toBe('homestead');
    expect(myPluginContext.network.chainId).toBe(1);
    expect(myPluginContext.daoFactoryAddress).toBe(
      contextParams.daoFactoryAddress
    );
    expect(myPluginContext.ensRegistryAddress).toBe(
      myPluginContext.network.ensAddress
    );
    expect(myPluginContext.gasFeeEstimationFactor).toBe(
      contextParams.gasFeeEstimationFactor
    );
    myPluginContext.web3Providers.map(provider =>
      expect(provider).toBeInstanceOf(JsonRpcProvider)
    );
    myPluginContext.ipfs.map(ipfsClient =>
      expect(ipfsClient).toBeInstanceOf(IpfsClient)
    );
    myPluginContext.graphql.map(graphqlClient =>
      expect(graphqlClient).toBeInstanceOf(GraphQLClient)
    );
    expect(myPluginContext.myPluginPluginAddress).toBe('notDefault');
  });
});
