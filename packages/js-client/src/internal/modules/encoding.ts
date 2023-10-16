import { MyPlugin__factory } from '../../../../contracts/typechain';
import { MyPluginContext } from '../../context';
import { PrepareInstallationParams } from '../../types';
import { IMyPluginClientEncoding } from '../interfaces';
import {
  ClientCore,
  DaoAction,
  PluginInstallItem,
  SupportedNetwork,
  SupportedNetworksArray,
} from '@aragon/sdk-client-common';
import { hexToBytes, UnsupportedNetworkError } from '@aragon/sdk-common';
import { defaultAbiCoder } from '@ethersproject/abi';
import { getNetwork, Networkish } from '@ethersproject/providers';

export class MyPluginClientEncoding
  extends ClientCore
  implements IMyPluginClientEncoding
{
  private myPluginAddress: string;
  private myPluginRepoAddress: string;

  constructor(context: MyPluginContext) {
    super(context);

    this.myPluginAddress = context.myPluginAddress;
    this.myPluginRepoAddress = context.myPluginRepoAddress;
  }

  public getPluginInstallItem(
    params: PrepareInstallationParams,
    network: Networkish
  ): PluginInstallItem {
    const networkName = getNetwork(network).name as SupportedNetwork;
    if (!SupportedNetworksArray.includes(networkName)) {
      throw new UnsupportedNetworkError(networkName);
    }

    // Parameters encoded into prepareInstallation's second argument
    const initializeABI = ['uint256'];

    const hexBytes = defaultAbiCoder.encode(initializeABI, [
      params.settings.number,
    ]);
    return {
      id: this.myPluginRepoAddress,
      data: hexToBytes(hexBytes),
    };
  }

  // implementation of the methods in the interface
  public storeNumberAction(number: bigint): DaoAction {
    const iface = MyPlugin__factory.createInterface();
    const data = iface.encodeFunctionData('storeNumber', [number]);
    return {
      to: this.myPluginAddress,
      value: BigInt(0),
      data: hexToBytes(data),
    };
  }
}
