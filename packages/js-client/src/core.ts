import { ClientCore } from "@aragon/sdk-client-common";
import { SimpleStorageContext } from "./context";

export class SimpleStorageClientCore extends ClientCore {
  public simpleStoragePluginAddress: string;
  public simpleStorageRepoAddress: string;

  constructor(pluginContext: SimpleStorageContext) {
    super(pluginContext);
    this.simpleStoragePluginAddress = pluginContext.simpleStoragePluginAddress;
    this.simpleStorageRepoAddress = pluginContext.simpleStorageRepoAddress;
  }
}
