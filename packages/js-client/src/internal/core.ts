import { MyPluginContext } from '../context';
import { ClientCore } from '@aragon/sdk-client-common';

export class MyPluginClientCore extends ClientCore {
  public myPluginPluginAddress: string;
  public myPluginRepoAddress: string;

  constructor(pluginContext: MyPluginContext) {
    super(pluginContext);
    this.myPluginPluginAddress = pluginContext.myPluginPluginAddress;
    this.myPluginRepoAddress = pluginContext.myPluginRepoAddress;
  }
}
