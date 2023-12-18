# Plugin Example

This file aims to provide an example of how to build a `js-client` following the guide in the [GUIDE.md](./GUIDE.md).

For this example we are going to build a `js-client` for the template plugin in this repository.

## Initialize the Project

The fist step is to initialize a `npm` project. You can use the following commands:

NPM:

```bash
mkdir js-client-example
cd js-client-example
npm init -y
```

Yarn:

```bash
mkdir js-client-example
cd js-client-example
yarn init -y
```

Now, we need to install the common tooling for `js-client` development.

NPM:

```bash
npm install `@aragon/sdk-client-common`

### Optional
npm install `@aragon/sdk-common`
```

Yarn:

```bash
yarn add `@aragon/sdk-client-common`

### Optional
yarn add `@aragon/sdk-common`
```

Now, create a `src` folder and a `index.ts` file inside it.

```bash
mkdir src
touch src/index.ts
```

The index file will be the entry point of our `js-client` and will export everything in the non-internal folders.

For this use case we will have:

- `src/client.ts`
- `src/context.ts`
- `src/types.ts`

```typescript
export * from './client';
export * from './context';
export * from './types';
```

## Create a `client.ts` File

This file will be the client entry point and will export a `Client` class that will be used to interact with the plugin.

This file should initialize all the modules used in the client. For this example wi will have 4 modules:

- `IMyPluginClientMethods` assigned to the public property `methods`
- `IMyPluginClientEstimation` assigned to the public property `estimation`
- `IMyPluginClientEncoding` assigned to the public property `encoding`
- `IMyPluginDecoding` assigned to the public property `decoding`

```typescript
// src/client.ts
import {MyPluginContext} from './context';
import {
  IMyPluginClient,
  IMyPluginClientDecoding,
  IMyPluginClientEncoding,
  IMyPluginClientEstimation,
  IMyPluginClientMethods,
  SimpleStorageClientEstimation,
  MyPluginClientDecoding,
  MyPluginClientEncoding,
  MyPluginClientMethods,
} from './internal';
import {MyPluginClientCore} from './internal/core';

export class MyPluginClient extends MyPluginClientCore implements IMyPluginClient {
  public methods: IMyPluginClientMethods;
  public estimation: IMyPluginClientEstimation;
  public encoding: IMyPluginClientEncoding;
  public decoding: IMyPluginClientDecoding;

  constructor(pluginContext: MyPluginContext) {
    super(pluginContext);
    this.methods = new MyPluginClientMethods(pluginContext);
    this.estimation = new SimpleStorageClientEstimation(pluginContext);
    this.encoding = new MyPluginClientEncoding(pluginContext);
    this.decoding = new MyPluginClientDecoding(pluginContext);
  }
}
```

This class extends the `MyPluginClientCore` class that will be explained later and implements the `IMyPluginClient` interface that will be used to type the client. Since the `MyPluginClientCore` class implements the `IMyPluginClient` interface we can use it to type the `MyPluginClient` class.

This is an internal interface that won't be exported so it will be stored in `src/internal/interfaces.ts`.

This file will include all the interfaces in the client. There are interfaces for the modules and for the client itself. The ones for the modules will be used to type the modules and the ones for the client will be used to type the client and will be explained later on.

```typescript
import {NumberListItem, NumbersQueryParams, PrepareInstallationParams} from '../types';
import {DaoAction, GasFeeEstimation, PrepareInstallationStepValue} from '@aragon/sdk-client-common';

// src/internal/interfaces.ts
export interface IMyPluginClient {
  methods: IMyPluginClientMethods;
  estimation: IMyPluginClientEstimation;
  encoding: IMyPluginClientEncoding;
  decoding: IMyPluginClientDecoding;
}

// This interface will be used to type the modules
// and will be explained later

export interface IMyPluginClientMethods {
  // fill with methods
  prepareInstallation(
    params: PrepareInstallationParams
  ): AsyncGenerator<PrepareInstallationStepValue>;
  getNumber(daoAddressOrEns: string): Promise<bigint>;
  getNumbers(params: NumbersQueryParams): Promise<NumberListItem[]>;
}
export interface IMyPluginClientEstimation {
  prepareInstallation(params: PrepareInstallationParams): Promise<GasFeeEstimation>;
}
export interface IMyPluginClientEncoding {
  storeNumberAction(number: bigint): DaoAction;
}
export interface IMyPluginClientDecoding {
  storeNumberAction(data: Uint8Array): bigint;
}
```

## Create a `context.ts` File

This file will be the context of the client and will store all the information needed by the plugin and receive the `contextParams` from the `MyPluginClient` constructor.

```typescript
// src/context.ts
import {MyPluginContextState, MyPluginOverriddenState} from './internal/types';
import {MyPluginContextParams} from './types';
import {Context, ContextCore} from '@aragon/sdk-client-common';

// set your defaults here or import them from a package
const DEFAULT_SIMPLE_STORAGE_PLUGIN_ADDRESS = '0x1234567890123456789012345678901234567890';
const DEFAULT_SIMPLE_STORAGE_Repo_ADDRESS = '0x2345678901234567890123456789012345678901';

export class MyPluginContext extends ContextCore {
  // super is called before the properties are initialized
  // so we initialize them to the value of the parent class
  protected state: MyPluginContextState = this.state;
  // TODO
  // fix typo in the overridden property name
  protected overriden: MyPluginOverriddenState = this.overriden;
  constructor(contextParams?: Partial<MyPluginContextParams>, aragonContext?: Context) {
    // call the parent constructor
    // so it does not complain and we
    // can use this
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

  public set(contextParams: MyPluginContextParams) {
    // the super function will call this set
    // so we need to call the parent set first
    super.set(contextParams);
    // set the default values for the new params
    this.setDefaults();
    // override default params if specified in the context
    if (contextParams.myPluginPluginAddress) {
      // override the myPluginPluginAddress value
      this.state.myPluginPluginAddress = contextParams.myPluginPluginAddress;
      // set the overriden flag to true in case set is called again
      this.overriden.myPluginPluginAddress = true;
    }

    if (contextParams.myPluginRepoAddress) {
      this.state.myPluginRepoAddress = contextParams.myPluginRepoAddress;
      this.overriden.myPluginRepoAddress = true;
    }
  }

  private setDefaults() {
    if (!this.overriden.myPluginPluginAddress) {
      // set the default value for myPluginPluginAddress
      this.state.myPluginPluginAddress = DEFAULT_SIMPLE_STORAGE_PLUGIN_ADDRESS;
    }
    if (!this.overriden.myPluginPluginAddress) {
      this.state.myPluginPluginAddress = DEFAULT_SIMPLE_STORAGE_Repo_ADDRESS;
    }
  }

  get myPluginPluginAddress(): string {
    return this.state.myPluginPluginAddress;
  }

  get myPluginRepoAddress(): string {
    return this.state.myPluginRepoAddress;
  }
}
```

At the beginning of the files we declare some default values for the plugin addresses. This values will be used if the user does not specify them in the context params.

Then we declare the `MyPluginContext` class that extends the `ContextCore` class and implements the `MyPluginContextParams` interface.

The `ContextCore` class is a class that contains the functionality for `web3`, `graphql` and `ipfs`. This class receives `ContextParams` this means that we need to extend the `ContextParams` interface and add the `MyPluginContextParams` interface to it. For that we will create a `types.ts` file in the `src` folder.

```typescript
// src/types.ts
import {ContextParams} from '@aragon/sdk-client-common';

export type MyPluginContextParams = ContextParams & {
  // optional so we can set default values for the parameter
  myPluginPluginAddress?: string;
  myPluginRepoAddress?: string;
  // add custom params
};
```

We will also need to extend the `ContextState` and the `OverriddenState` types to add the new properties to them in consonance with the new context params. Since it is only an internal type we will store it in the `src/internal/types.ts` file.

```typescript
import {ContextState, OverriddenState} from '@aragon/sdk-client-common';

export type MyPluginContextState = ContextState & {
  // extend the Context state with a new state for storing
  // the new parameters
  myPluginPluginAddress: string;
  myPluginRepoAddress: string;
};
export type MyPluginOverriddenState = OverriddenState & {
  [key in keyof MyPluginContextState]: boolean;
};
```

Now we can import the `MyPluginContextParams` interface and `MyPluginContextState` and `MyPluginOverriddenState` types and use them in the `context.ts` and use it in the class constructor.

```typescript
import {MyPluginContextState, MyPluginOverriddenState} from './internal/types';
import {MyPluginContextParams} from './types';
import {Context, ContextCore} from '@aragon/sdk-client-common';

// set your defaults here or import them from a package
const DEFAULT_SIMPLE_STORAGE_PLUGIN_ADDRESS = '0x1234567890123456789012345678901234567890';
const DEFAULT_SIMPLE_STORAGE_REPO_ADDRESS = '0x2345678901234567890123456789012345678901';

export class MyPluginClient extends ClientCore {
  protected state: MyPluginContextState = this.state;
  protected overridden: MyPluginOverriddenState = this.overriden;
  constructor(contextParams?: Partial<MyPluginContextParams>, aragonContext?: Context) {
    super();
  }
}
```

For the constructor we will ask for the `aragonContext` in case we want to use the `Context` class to initialize the `MyPluginContext` class.

So first thing we will call an empty `super()` to initialize the `ContextCore` class and then if an aragon context is provided we will copy the properties from the `Context` class to the `MyPluginContext` class.

If the params are provided we will call the `set` function to set the context params. This function will right now call the set in the parent class so it setups the params for `web3`, `graphql` and `ipfs` and then it will set the default values for the new params and override them if they are provided in the context params.

```typescript
export class MyPluginClient extends ClientCore {
  protected state: MyPluginContextState = this.state;
  protected overridden: MyPluginOverriddenState = this.overriden;
  constructor(contextParams?: Partial<MyPluginContextParams>, aragonContext?: Context) {
    super();
    // set the context params inherited from the context
    if (aragonContext) {
      // copy the context properties to this
      Object.assign(this, aragonContext);
    }
    // contextParams have priority over the aragonContext
    if (contextParams) {
      // override the context params with the ones passed to the constructor
      this.set(contextParams);
    }
  }
  public set(contextParams: Partial<MyPluginContextParams>) {
    // call the parent set
    super.set(contextParams);
  }
}
```

Now the set will setup the `ContextCore` but still we need to setup the new params. For that we will write a `setDefaults` function that will set the default values for the new params and will be called in the `set` function, after that we will check if the params are provided and if they are we will override the default values and set the overriden flag to true.

The setDefaults function must check if the params are overriden before setting the default values. This is because the `setDefaults` function will be called every time the `set` function is called and we don't want to override the values if they are already overriden.

For last we will add getters for the new params so we can access them from the client.

```typescript
export class MyPluginClient extends ClientCore {
  protected state: MyPluginContextState = this.state;
  protected overridden: MyPluginOverriddenState = this.overriden;
  constructor(contextParams?: Partial<MyPluginContextParams>, aragonContext?: Context) {
    super();
    // set the context params inherited from the context
    if (aragonContext) {
      // copy the context properties to this
      Object.assign(this, aragonContext);
    }
    // contextParams have priority over the aragonContext
    if (contextParams) {
      // override the context params with the ones passed to the constructor
      this.set(contextParams);
    }
  }
  public set(contextParams: Partial<MyPluginContextParams>) {
    // call the parent set
    super.set(contextParams);
    this.setDefaults();
    if (contextParams.myPluginPluginAddress) {
      // override the myPluginPluginAddress value
      this.state.myPluginPluginAddress = contextParams.myPluginPluginAddress;
      // set the overriden flag to true in case set is called again
      this.overriden.myPluginPluginAddress = true;
    }
    if (contextParams.myPluginRepoAddress) {
      this.state.myPluginRepoAddress = contextParams.myPluginRepoAddress;
      this.overriden.myPluginRepoAddress = true;
    }
  }

  private setDefaults() {
    if (!this.overriden.myPluginPluginAddress) {
      // set the default value for myPluginPluginAddress
      this.state.myPluginPluginAddress = DEFAULT_SIMPLE_STORAGE_PLUGIN_ADDRESS;
    }
    if (!this.overriden.myPluginPluginAddress) {
      this.state.myPluginPluginAddress = DEFAULT_SIMPLE_STORAGE_REPO_ADDRESS;
    }
  }

  get myPluginPluginAddress(): string {
    return this.state.myPluginPluginAddress;
  }

  get myPluginRepoAddress(): string {
    return this.state.myPluginRepoAddress;
  }
}
```

With this we have the `context.ts` file finished and basically all the classes an types that will be exported from the `js-client`. So now is time to move on to the modules.

## Modules

If you go back to the `client.ts` file you will see that we are importing 4 modules:

- `IMyPluginClientMethods` assigned to the public property `methods`
- `IMyPluginClientEstimation` assigned to the public property `estimation`
- `IMyPluginClientEncoding` assigned to the public property `encoding`
- `IMyPluginDecoding` assigned to the public property `decoding`

Each of this modules have a specific functionality, this modules will be the responsible for the logic of the client and will interact with the deployed contracts. We made this division so the client is easier to maintain and to test but you can use your own if you prefer.

### Methods

This will contain all the methods that the client will expose to the user. This methods will be used to interact with the plugin.

For this specific example we will have 3 methods:

- `prepareInstallation`
- `getNumber`
- `getNumbers`

So we will add the `methods.ts` file to the `src/internal/modules` folder and create the class `MyPluginClientMethods` that will implement the `IMyPluginClientMethods` interface.

The `IMyPluginClientMethods` interface will be located in the `src/internal/interfaces.ts` file.

We use this for type safety but is totally optional.

```typescript
// src/internal/interfaces.ts

export interface IMyPluginClientMethods {
  // fill with methods
  prepareInstallation(
    params: PrepareInstallationParams
  ): AsyncGenerator<PrepareInstallationStepValue>;
  getNumber(daoAddressOrEns: string): Promise<bigint>;
  getNumbers(params: NumbersQueryParams): Promise<NumberListItem[]>;
}
```

Now in the `src/internal/modules/methods.ts` file we will create the `MyPluginClientMethods` class that will implement the `IMyPluginClientMethods` interface.

```typescript
// src/internal/modules/methods.ts
import {PrepareInstallationParams, PrepareInstallationStepValue} from '../../types';
import {MyPluginContext} from '../context';
import {IMyPluginClientMethods} from '../interfaces';
import {DaoAction, DaoActionType, DaoScript, DaoScriptStep} from '@aragon/sdk-client-common';

export class MyPluginClientMethods implements IMyPluginClientMethods {
  public async *prepareInstallation(
    params: PrepareInstallationParams
  ): AsyncGenerator<PrepareInstallationStepValue> {
    // TODO
    // implement prepareInstallation
  }

  public async getNumber(daoAddressOrEns: string): Promise<bigint> {
    // TODO
    // implement getNumber
  }

  public async getNumbers(params: NumbersQueryParams): Promise<NumberListItem[]> {
    // TODO
    // implement getNumbers
  }
}
```

For the `prepareInstallation` method we will use a generator function so we can return the steps one by one. This is useful for the UI so it can show the progress of the installation. We can import the `prepareGenericInstallation` function from the `@aragon/sdk-client-common` package to help us with the implementation and use the `myPluginRepoAddress` stored in the context to call it.

```typescript
// src/internal/modules/methods.ts
import * as BUILD_METADATA from '../../../../contracts/src/build-metadata.json';
import {MyPluginContext} from '../context';
import {IMyPluginClientMethods} from '../interfaces';
import {PrepareInstallationParams, PrepareInstallationStepValue} from '../../types';
import {
  prepareGenericInstallation,
  PrepareInstallationStepValue,
} from '@aragon/sdk-client-common';

export class MyPluginClientMethods implements IMyPluginClientMethods {
  public async *prepareInstallation(
    params: PrepareInstallationParams
  ): AsyncGenerator<PrepareInstallationStepValue> {
    yield* prepareGenericInstallation(this.web3, {
      daoAddressOrEns: params.daoAddressOrEns,
      pluginRepo: this.myPluginRepoAddress,
      version: params.version,
      installationAbi: BUILD_METADATA.pluginSetup.prepareInstallation.inputs,
      installationParams: [params.settings.number],
    });
  }

  public async getNumber(daoAddressOrEns: string): Promise<bigint> {
    // TODO
    // implement getNumber
  }

  public async getNumbers(params: NumbersQueryParams): Promise<NumberListItem[]> {
    // TODO
    // implement getNumbers
  }
}
```

If you want to provide a getting data functionality you can use subgraph to do so. Since the subgraph is already set up by the `ContextCore` class you can use the `graphql` property to query the subgraph.

```typescript
// src/internal/modules/methods.ts
import * as BUILD_METADATA from '../../../../contracts/src/build-metadata.json';
import {MyPluginContext} from '../context';
import {IMyPluginClientMethods} from '../interfaces';
import {PrepareInstallationParams, PrepareInstallationStepValue} from '../../types';
import {
  prepareGenericInstallation,
  PrepareInstallationStepValue,
} from '@aragon/sdk-client-common';

export class MyPluginClientMethods implements IMyPluginClientMethods {
  public async *prepareInstallation(
    params: PrepareInstallationParams
  ): AsyncGenerator<PrepareInstallationStepValue> {
    yield* prepareGenericInstallation(this.web3, {
      daoAddressOrEns: params.daoAddressOrEns,
      pluginRepo: this.myPluginRepoAddress,
      version: params.version,
      installationAbi: BUILD_METADATA.pluginSetup.prepareInstallation.inputs,
      installationParams: [params.settings.number],
    });
  }

  public async getNumber(daoAddressOrEns: string): Promise<bigint> {
    const query = QueryNumber;
    const name = 'Numbers';
    type T = {dao: SubgraphNumber};
    const {dao} = await this.graphql.request<T>({
      query,
      params: {id: daoAddressOrEns},
      name,
    });
    return toNumber(dao);
  }

  public async getNumbers(params: NumbersQueryParams): Promise<NumberListItem[]> {
    const query = QueryNumbers;
    const params = {
      limit,
      skip,
      direction,
      sortBy,
    };
    const name = 'Numbers';
    type T = {daos: SubgraphNumberListItem[]};
    const {daos} = await this.graphql.request<T>({
      query,
      params,
      name,
    });
    return Promise.all(
      daos.map(async number => {
        return toNumberListItem(number);
      })
    );
  }
}
```

### Estimation

This module will be used to estimate the gas cost of the methods. This is useful for the UI so it can show the gas cost of a transaction before sending it. This will mimic the methods interface but only with the functions that actually send a transaction to the blockchain.

For this specific example we will have 1 method:

- `prepareInstallation`

So we will add the `estimation.ts` file to the `src/internal/modules` folder and create the class `MyPluginClientEstimation` that will implement the `IMyPluginClientEstimation` interface.

The `IMyPluginClientEstimation` interface will be located in the `src/internal/interfaces.ts` file.

We use this for type safety but again is totally optional.

```typescript
// src/internal/interfaces.ts
export interface IMyPluginClientEstimation {
  prepareInstallation(params: PrepareInstallationParams): Promise<GasFeeEstimation>;
}
```

Now in the `src/internal/modules/estimation.ts` file we will create the `MyPluginClientEstimation` class that will implement the `IMyPluginClientEstimation` interface.

```typescript
// src/internal/modules/estimation.ts
import {PrepareInstallationParams} from '../../types';
import {MyPluginContext} from '../context';
import {IMyPluginClientEstimation} from '../interfaces';
import {GasFeeEstimation} from '@aragon/sdk-client-common';

export class MyPluginClientEstimation implements IMyPluginClientEstimation {
  public async prepareInstallation(params: PrepareInstallationParams): Promise<GasFeeEstimation> {
    // TODO
    // implement prepareInstallation
  }
}
```

Now we can also use the provided helper function to estimate the gas cost of the `prepareInstallation` method.

```typescript
// src/internal/modules/estimation.ts
import {PrepareInstallationParams} from '../../types';
import {MyPluginContext} from '../context';
import {IMyPluginClientEstimation} from '../interfaces';
import {GasFeeEstimation} from '@aragon/sdk-client-common';

export class MyPluginClientEstimation implements IMyPluginClientEstimation {
  public async prepareInstallation(params: PrepareInstallationParams): Promise<GasFeeEstimation> {
    return prepareGenericInstallationEstimation(this.web3, {
      daoAddressOrEns: params.daoAddressOrEns,
      pluginRepo: this.myPluginRepoAddress,
      version,
      installationAbi: BUILD_METADATA.pluginSetup.prepareInstallation.inputs,
      installationParams: [params.settings.number],
    });
  }
}
```

### Encoding and Decoding

These two modules will be used for encoding and decodeing actions that will be passed to de proposals. This two modules come as a pair so for each encoding function should be a decoding function.

For this plugin we only have one action so we will only have one encoding and decoding function.

- `storeNumberAction`

So as we did with the rest of modules we will add the interface in the `src/internal/interfaces.ts` file.

```typescript
// src/internal/interfaces.ts

export interface IMyPluginClientEncoding {
  storeNumberAction(number: bigint): DaoAction;
}
export interface IMyPluginClientDecoding {
  storeNumberAction(data: Uint8Array): bigint;
}
```

And now in the `src/internal/modules/encoding.ts` file we will create the `MyPluginClientEncoding` class that will implement the `IMyPluginClientEncoding` interface.

```typescript
// src/internal/modules/encoding.ts
import {MyPlugin__factory} from '../../../types';
import {MyPluginClientCore} from '../core';
import {IMyPluginClientEncoding} from '../interfaces';
import {DaoAction} from '@aragon/sdk-client-common';
import {hexToBytes} from '@aragon/sdk-common';

export class MyPluginClientEncoding extends MyPluginClientCore implements IMyPluginClientEncoding {
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
```

And in the decoding file we will create the `MyPluginClientDecoding` class that will implement the `IMyPluginClientDecoding` interface.

```typescript
// src/internal/modules/decoding.ts
import {MyPlugin__factory} from '../../../types';
import {MyPluginClientCore} from '../core';
import {IMyPluginClientDecoding} from '../interfaces';

export class MyPluginClientDecoding extends MyPluginClientCore implements IMyPluginClientDecoding {
  public storeNumberAction(data: Uint8Array): bigint {
    const iface = MyPlugin__factory.createInterface();
    const res = iface.decodeFunctionData('storeNumber', data);
    return BigInt(res[0]);
  }
}
```

These encoders and decoder both use the types generated by the `typechain` package, so be sure to run `yarn typechain` before building the client.
