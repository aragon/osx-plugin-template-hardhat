import {
  SimpleStorageContextParams,
  SimpleStorageContextState,
  SimpleStorageOverridenState,
} from "./types";
import { Context, ContextCore } from "@aragon/sdk-client-common";

// set your defaults here or import them from a package
const DEFAULT_SIMPLE_STORAGE_PLUGIN_ADDRESS =
  "0x1234567890123456789012345678901234567890";
const DEFAULT_SIMPLE_STORAGE_Repo_ADDRESS =
  "0x2345678901234567890123456789012345678901";

export class SimpleStorageContext extends ContextCore {
  // super is called before the properties are initialized
  // so we initialize them to the value of the parent class
  protected state: SimpleStorageContextState = this.state;
  protected overriden: SimpleStorageOverridenState = this.overriden;
  constructor(
    contextParams?: Partial<SimpleStorageContextParams>,
    aragonContext?: Context,
  ) {
    // parent contructor will call this.set(contextParams)
    // so we don't need to call it again
    super(contextParams);
    if (aragonContext) {
      // copy the context properties to this
      Object.assign(this, aragonContext);
    }
    if (contextParams) {
      // overide the context params with the ones passed to the constructor
      this.set(contextParams ?? {});
    }
  }

  public set(contextParams: SimpleStorageContextParams) {
    // the super function will call this set
    // so we need to call the parent set first
    super.set(contextParams);
    // set the default values for the new params
    this.setDefaults();
    // override default params if specified in the context
    if (contextParams.simpleStoragePluginAddress) {
      // override the simpleStoragePluginAddress value
      this.state.simpleStoragePluginAddress =
        contextParams.simpleStoragePluginAddress;
      // set the overriden flag to true in case set is called again
      this.overriden.simpleStoragePluginAdddress = true;
    }

    if (contextParams.simpleStorageRepoAddress) {
      this.state.simpleStorageRepoAddress =
        contextParams.simpleStorageRepoAddress;
      this.overriden.simpleStorageRepoAdddress = true;
    }
  }

  private setDefaults() {
    if (!this.overriden.simpleStoragePluginAddress) {
      // set the default value for simpleStoragePluginAddress
      this.state.simpleStoragePluginAddress =
        DEFAULT_SIMPLE_STORAGE_PLUGIN_ADDRESS;
    }
    if (!this.overriden.simpleStoragePluginAddress) {
      this.state.simpleStoragePluginAddress =
        DEFAULT_SIMPLE_STORAGE_Repo_ADDRESS;
    }
  }

  get simpleStoragePluginAddress(): string {
    return this.state.simpleStoragePluginAddress;
  }

  get simpleStorageRepoAddress(): string {
    return this.state.simpleStorageRepoAddress;
  }
}
