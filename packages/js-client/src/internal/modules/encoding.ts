import {MyPlugin__factory} from '../../../types';
import {MyPluginClientCore} from '../core';
import {IMyPluginClientEncoding} from '../interfaces';
import {DaoAction} from '@aragon/sdk-client-common';
import {hexToBytes} from '@aragon/sdk-common';

export class MyPluginClientEncoding
  extends MyPluginClientCore
  implements IMyPluginClientEncoding
{
  // implementation of the methods in the interface
  public storeNumberAction(number: bigint): DaoAction {
    const iface = MyPlugin__factory.createInterface();
    const data = iface.encodeFunctionData('storeNumber', [number]);
    return {
      to: this.myPluginPluginAddress,
      value: BigInt(0),
      data: hexToBytes(data),
    };
  }
}
