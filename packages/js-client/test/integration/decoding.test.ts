import { MyPluginClient, MyPluginContext } from '../../src';
import { contextParamsLocalChain } from '../constants';
import { ContextCore, SupportedNetworksArray } from '@aragon/sdk-client-common';
import { hexToBytes } from '@aragon/sdk-common';

jest.spyOn(SupportedNetworksArray, 'includes').mockReturnValue(true);
jest
  .spyOn(ContextCore.prototype, 'network', 'get')
  .mockReturnValue({ chainId: 5, name: 'goerli' });

describe('Decoding', () => {

  it('should decode an action', async () => {
    const ctx = new MyPluginContext(contextParamsLocalChain);
    const client = new MyPluginClient(ctx);
    const data = hexToBytes(
      '0xb63394180000000000000000000000000000000000000000000000000000000000000002'
    );
    const decodedNum = client.decoding.storeNumberAction(data);
    expect(decodedNum).toBe(BigInt(2));
  });
});
