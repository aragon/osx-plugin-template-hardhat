import {MyPlugin__factory} from '../../../types';
import {MyPluginClientCore} from '../core';
import {IMyPluginClientDecoding} from '../interfaces';

export class MyPluginClientDecoding
  extends MyPluginClientCore
  implements IMyPluginClientDecoding
{
  public storeNumberAction(data: Uint8Array): bigint {
    const iface = MyPlugin__factory.createInterface();
    const res = iface.decodeFunctionData('storeNumber', data);
    return BigInt(res[0]);
  }
}
