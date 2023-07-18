import { SimpleStorageContext } from '../context';
import { ClientCore } from '@aragon/sdk-client-common';

export class SimpleStorageClientCore extends ClientCore {
  public simpleStoragePluginAddress: string;
  public simpleStorageRepoAddress: string;

  constructor(pluginContext: SimpleStorageContext) {
    super(pluginContext);
    this.simpleStoragePluginAddress = pluginContext.simpleStoragePluginAddress;
    this.simpleStorageRepoAddress = pluginContext.simpleStorageRepoAddress;
  }
}
