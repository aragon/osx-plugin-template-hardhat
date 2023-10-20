import { MyPluginClient, MyPluginContext } from '../../src';
import { contextParamsLocalChain } from '../constants';
import { ContextCore, SupportedNetworksArray } from '@aragon/sdk-client-common';

jest.spyOn(SupportedNetworksArray, 'includes').mockReturnValue(true);
jest
  .spyOn(ContextCore.prototype, 'network', 'get')
  .mockReturnValue({ chainId: 5, name: 'goerli' });

describe('Encoding', () => {  
  it('should encode an action', async () => {
    const ctx = new MyPluginContext(contextParamsLocalChain);
    const client = new MyPluginClient(ctx);
    const num = BigInt(2);
    const action = client.encoding.storeNumberAction(num);
    expect(action.to).toBe(contextParamsLocalChain.myPluginPluginAddress);
    expect(action.data instanceof Uint8Array).toBe(true);
    expect(action.data.length).toBeGreaterThan(0);
    const decodedNum = client.decoding.storeNumberAction(action.data);
    expect(decodedNum).toBe(num);
  });
});
