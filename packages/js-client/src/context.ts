import {
  MyPluginContextState,
  MyPluginOverriddenState,
} from './internal/types';
import { MyPluginContextParams } from './types';
import { Context, ContextCore } from '@aragon/sdk-client-common';

// set your defaults here or import them from a package
const DEFAULT_SIMPLE_STORAGE_REPO_ADDRESS =
  '0x1234567890123456789012345678901234567890';

export class MyPluginContext extends ContextCore {
  // super is called before the properties are initialized
  // so we initialize them to the value of the parent class
  protected state: MyPluginContextState = this.state;

  // TODO: fix typo in the overridden property name
  protected overriden: MyPluginOverriddenState = this.overriden;
  constructor(
    contextParams?: Partial<MyPluginContextParams>,
    aragonContext?: Context
  ) {
    // call the parent constructor so it does not complain and we can use this
    super();

    // set the context params inherited from the context
    if (aragonContext) {
      // copy the context properties to this
      Object.assign(this, aragonContext);
    }

    // contextParams have priority over the aragonContext
    if (contextParams) {
      // overide the context params with the ones passed to the constructor
      this.set(contextParams);
    }
  }

  public set(contextParams: Partial<MyPluginContextParams>) {
    // the super function will call this set
    // so we need to call the parent set first
    super.set(contextParams);

    // set the default values for the new params
    this.setDefaults();

    // override default params if specified in the context
    if (contextParams.myPluginAddress) {
      // override the myPluginAddress value
      this.state.myPluginAddress = contextParams.myPluginAddress;
      // set the overriden flag to true in case set is called again
      this.overriden.myPluginAddress = true;
    }

    if (contextParams.myPluginRepoAddress) {
      this.state.myPluginRepoAddress = contextParams.myPluginRepoAddress;
      this.overriden.myPluginRepoAddress = true;
    }
  }

  private setDefaults() {
    // Optional: set the default for parameters that might be known ahead of time
    if (!this.overriden.myPluginAddress) {
      this.state.myPluginAddress = DEFAULT_SIMPLE_STORAGE_REPO_ADDRESS;
    }
  }

  get myPluginAddress(): string {
    return this.state.myPluginAddress;
  }

  get myPluginRepoAddress(): string {
    return this.state.myPluginRepoAddress;
  }
}
