import {
  SimpleStorageContextParams,
  SimpleStorageContextState,
  SimpleStorageOverridenState,
} from "./types";
import { Context, ContextCore } from "@aragon/sdk-client-common";

export class SimpleStorageContext extends ContextCore {
  // super is called before the properties are initialized
  // so we initialize them to the value of the parent class
  protected state: SimpleStorageContextState = this.state;
  protected overriden: SimpleStorageOverridenState = this.overriden;
  constructor(
    contextParams?: Partial<SimpleStorageContextParams>,
    context?: Context,
  ) {
    // parent contructor will call this.set(contextParams)
    // so we don't need to call it again
    super(contextParams);
    if (context) {
      // copy the context properties to this
      Object.assign(this, context);
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
    if (contextParams.myParam) {
      // override the myParam value
      this.state.myParam = contextParams.myParam;
      // set the overriden flag to true in case set is called again
      this.overriden.myParam = true;
    }
  }

  private setDefaults() {
    if (!this.overriden.myParam) {
      // set the default value for myParam
      this.state.myParam = "default";
    }
  }

  get myParam(): string {
    return this.state.myParam;
  }
}
