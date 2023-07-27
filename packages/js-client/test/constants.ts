import { MyPluginContextParams } from '../src/types';
import { Wallet } from '@ethersproject/wallet';

export const ADDRESS_ONE = '0x0000000000000000000000000000000000000001';

export const TEST_WALLET =
  '0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e';

export const contextParamsLocalChain: MyPluginContextParams = {
  network: 31337,
  signer: new Wallet(TEST_WALLET),
  daoFactoryAddress: '0xf8065dD2dAE72D4A8e74D8BB0c8252F3A9acE7f9',
  web3Providers: ['http://localhost:8545'],
  ipfsNodes: [
    {
      url: 'https://example.com',
    },
  ],
  graphqlNodes: [
    {
      url: 'https://example.com',
    },
  ],
};
