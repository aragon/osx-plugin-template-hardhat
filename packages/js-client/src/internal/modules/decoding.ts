import { MyPlugin__factory } from '../../../../contracts/typechain';
import { IMyPluginClientDecoding } from '../interfaces';
import { ClientCore } from '@aragon/sdk-client-common';

export class MyPluginClientDecoding
  extends ClientCore
  implements IMyPluginClientDecoding
{
  public storeNumberAction(data: Uint8Array): bigint {
    const iface = MyPlugin__factory.createInterface();
    const res = iface.decodeFunctionData('storeNumber', data);
    return BigInt(res[0]);
  }
}
