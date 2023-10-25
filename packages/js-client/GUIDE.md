# Step-by-step guide to build a JS client

---

## Introduction

The main goal of this guide is to show how to build a JS client for your Aragon OSx plugin. This guide assumes that you have already created a plugin and that you have a basic understanding of how Aragon OS works.

An Aragon OSx plugin is composed of four mainly components, not all of them are mandatory:

- Contracts
- JS Client (optional)
- Subgraph (optional)
- UI (optional)

The JS client sits as a middle layer between the contracts and the UI. It is responsible for fetching data from the contracts and exposing it to the UI. It also handles the communication between the UI and the contracts.

Using this template and the `@aragon/sdk-client-common` package, you will be able to build a JS client for your plugin in a few minutes.

The `@aragon/sdk-client-common` package provides a set tools to build a JS client for your plugin, it mainly gives you helpers and battle tested logic for handling connections with external services such as:

- Web3 providers
- Subgraph
- IPFS

This package handles for you the connection (fail prevention, error handling, connection retry...) and basic functionality of these services, so you can focus on building your plugin.

### Why a JS client?

As mentioned before, the JS client is a totally optional step in the process of creating an Aragon OS plugin. You can definitely build a plugin without a JS client, but you will be missing some benefits.

Aragon common packages will handle the connection to IPFS, Subgraph and blockchain providers, so you don't have to reinvent the wheel.

Additionally, is giving some structure to your plugin, if you plan on doing some complex logic in your plugin, it is a good idea to have a JS client to handle it and leave the UI handling only the UI logic.

## Getting started

To get started with your client the first step is to create a nes JS/TS project you can use any tool you want.

Once you have your project set up yo need to install the `@aragon/sdk-client-common` package.

```bash
npm install @aragon/sdk-client-common
// or
yarn add @aragon/sdk-client-common
```

Once you have the package installed you can start building your client.

There are 3 main files that you will need to build your client:

- `src/client.ts`
- `src/context.ts`
- `src/types.ts`

### `src/types.ts`

This file will include the types that your client will export, the first type that you will need will be the `ContextParams` type, this type will be used to define the parameters that your client will receive and it should be an extension of the ContextParams type from `@aragon/sdk-client-common`. This params will be later stored in the context and accessible by the modules, so if you have some endpoint, address or any other value that you need to access from your modules you should add it here.

There are two additional types that you will need to add in this file.

- `MyPluginState`: This type will be used to define the state of your client, this state will be stored in the context and it will be accessible by the modules. This type should extend the `ClientState` type from `@aragon/sdk-client-common`.

- `MyPluginOverriddenState`: This type will be used to track what values have been modified and what values are default. This type should also extend the `OverriddenState` type from `@aragon/sdk-client-common`.

In this file you should also define the state type of your client, this should extend the `ClientState` type from `@aragon/sdk-client-common`. This type will be used to define the state of your client, this state will be stored in the context and it will be accessible by the modules.

```ts
// src/types.ts
import {ContextParams} from '@aragon/sdk-client-common';

export type MyPluginClientParams = ContextParams & {
  myCustomParam: string;
  myCustomBackendUrl: string;
  // Your custom params
};

export type MyPluginState = ClientState & {
  myCustomParam: string;
  // In the context you will be able to work with the params
  // so the state can be a client for a service instead of the
  // actual value
  myCustomBackendClient: MyCustomBackendClient[];
};

export type MyPluginOverriddenState = OverriddenState & {
  [key in keyof MyPluginContextState]: boolean;
};
```

### `src/context.ts`

The context is the responsible for storing the state of the of the client and setting the default values for the params. The context is also responsible for doing any kind of operation such as modifying some parameter, or using a parameter for creating a client for a service.

This `Context` uses the previously defined `state` and `overriddenState` types.

```ts
// src/context.ts
export class MyPluginClientContext extends Context {
  protected state: MyPluginContextState;
  protected overridden: MyPluginOverriddenState;

  constructor(params?: Partial<MyPluginClientParams>) {
    super();
    this.set(contextParams);
  }

  public set(params: Partial<MyPluginClientParams>) {
    // First we need to set the values in the parent class
    super.set(params);
    // Then we can set the values in our context
    if (params.myCustomParam) {
      this.state.myCustomParam = params.myCustomParam;
      this.overridden.myCustomParam = true;
    }
    if (params.myCustomBackendUrl) {
      this.state.myCustomBackendClient = new MyCustomBackendClient(params.myCustomBackendUrl);
      this.overridden.myCustomBackendClient = true;
    }
  }
}
```

In the minimal version of this file you just receive the contextParams on the constructor, but you can also improve this, by receiving an aragon context and reusing it to create a context for your client.

```ts
// src/context.ts
export class MyPluginClientContext extends Context {
  protected state: MyPluginContextState;
  protected overridden: MyPluginOverriddenState;

  constructor(params?: Partial<MyPluginClientParams>, context?: Context) {
    super();
    if (context) {
      // copy the context properties to this
      Object.assign(this, context);
    }
    if (contextParams) {
      // override the context params with the ones passed to the constructor
      this.set(contextParams);
    }
  }

  // Other methods
}
```

You can also add more methods and helpers in this calss that can make your life easieer whule building your client like `getters` or `setters` for the state or a function that sets the defualt values for the state.

This could be an example of a more complete Context class.

```ts
// src/context.ts
const DEFAULT_MY_CUSTOM_PARAM = 'default value';
const DEFAULT_MY_CUSTOM_BACKEND_URL = 'https://my-custom-backend.com';

export class MyPluginClientContext extends Context {
  protected state: MyPluginContextState;
  protected overridden: MyPluginOverriddenState;

  constructor(params?: Partial<MyPluginClientParams>, context?: Context) {
    super();
    if (context) {
      // copy the context properties to this
      Object.assign(this, context);
    }
    if (contextParams) {
      // override the context params with the ones passed to the constructor
      this.set(contextParams);
    }
  }

  public set(params: Partial<MyPluginClientParams>) {
    // First we need to set the values in the parent class
    super.set(params);
    // Then we can set the values in our context
    if (params.myCustomParam) {
      this.state.myCustomParam = params.myCustomParam;
      // We also need to set the overridden state to true
      this.overridden.myCustomParam = true;
    }
    if (params.myCustomBackendUrl) {
      this.state.myCustomBackendClient = new MyCustomBackendClient(params.myCustomBackendUrl);
      this.overridden.myCustomBackendClient = true;
    }
  }

  private setDefaults() {
    // check that thee value wasn't already set
    if (!this.overridden.myCustomParam) {
      this.state.myCustomParam = DEFAULT_MY_CUSTOM_PARAM;
    }
    if (!this.overridden.myCustomBackendClient) {
      this.state.myCustomBackendClient = new MyCustomBackendClient(DEFAULT_MY_CUSTOM_BACKEND_URL);
    }
  }

  get myCustomParam() {
    return this.state.myCustomParam;
  }

  get myCustomBackendClient() {
    return this.state.myCustomBackendClient;
  }
}
```

### `src/client.ts`

The client class is the one that will be used to call functionality from the UI, it's main purpose is to initialize and expose the available modules and variables.

```ts
// src/client.ts
import {ClientCore} from '@aragon/sdk-client-common';

export class MyPluginClient extends ClientCore {
  public methods: MyCustomMethodsModule;
  public estimation: MyCustomEstimationModule;
  public myCustomParam: string;
  public myCustomBackendClient: MyCustomBackendClient;
  constructor(context: MyCustomContext) {
    super(context);
    this.methods = new MyCustomMethodsModule(context);
    this.estimation = new MyCustomEstimationModule(context);
    this.myCustomParam = context.myCustomParam;
    this.myCustomBackendClient = context.myCustomBackendClient;
  }
}
```

Now when you use the client from an UI you will be able to access the modules and the variables.

```ts
const contextParams: MyPluginClientParams = {
  myCustomParam: 'my custom param',
  myCustomBackendUrl: 'https://my-custom-backend.com',
};
const context = new MyPluginClientContext(contextParams, aragonContext);
const client = new MyPluginClient(context);

client.methods.myCustomMethod();
client.estimation.myCustomEstimation();
```

## Modules

With the previously mentioned setup now you can create modules that have access to the context and the state of your client, and the modules provided by `@aragon/sdk-client-common`.

The modules exposed by `@aragon/sdk-client-common` are:

- Web3
- IPFS
- GraphQL

### Web3

The web3 module takes care of connecting to the blockchain and exposing the web3 instance to the modules.
the web3 modules has the following methods:

#### `shiftProvider(): void`

This method will shift the provider to the next one in the list, this is useful when you want to change the provider.

#### `getProvider(): JsonRpcProvider`

This method will return the current provider.

#### `getSigner(): Signer`

This method will return the current signer.

#### `getNetworkName(): SupportedNetwork`

This method will return the current network name.

#### `getConnectedSigner(): Signer`

This method will return the current signer, ensuring that it has a provider.

#### `isUp(): Promise<boolean>`

Checks if the current provider is up.

#### `ensureOnline(): Promise<void>`

Ensures that the current provider is up, if it isn't up it changes automatically to one that is up. If none of the providers is up it will throw an error.

#### `attachContract(address: string, abi: ContractInterface): Contract`

Receives an address and an abi and returns a contract instance connected to the current signer and provider

#### `getMaxFeePerGas(): Promise<bigint>`

Returns the max fee per gas for the current network.

#### `getApproximateGasFee(estimatedGas: bigint)`

Returns the approximate gas fee for the current given the estimation.

#### `getAddress(addressName: DeployedAddresses): string`

Returns the address of a contract deployed in the current network.

### IPFS

#### `getClient(): IpfsClient`

Returns the current IPFS client.

#### `shiftClient(): void`

Shifts the IPFS client to the next one in the list.

#### `isUp(): Promise<boolean>`

Checks if the current IPFS client is up.

#### `ensureOnline(): Promise<void>`

Ensures that the current IPFS client is up, if it isn't up it changes automatically to one that is up. If none of the clients is up it will throw an error.

#### `getOnlineClient(): Promise<IpfsClient>`

Returns the first IPFS client that is up.

#### `add(input: string | Uint8Array): Promise<string>`

Adds a file to IPFS and returns the hash.

#### `pin(input: string): Promise<PinResponse>`

Pins a file in IPFS and returns the response.

#### `fetchBytes(cid: string): Promise<Uint8Array | undefined>`

Fetches a file from IPFS and returns the content as an Uint8Array.

#### `fetchString(cid: string): Promise<string> `

Fetches a file from IPFS and returns the content as a string.

### GraphQL

#### `getClient(): GraphQLClient`

Returns the current GraphQL client.

#### `shiftClient(): void`

Shifts the GraphQL client to the next one in the list.

#### `isUp(): Promise<boolean>`

Checks if the current GraphQL client is up.

#### `ensureOnline(): Promise<void>`

Ensures that the current GraphQL client is up, if it isn't up it changes automatically to one that is up. If none of the clients is up it will throw an error.

#### `request({ query, params, name }): Promise<any>`

Makes a request to the current GraphQL client. It will retry the request if it fails switching to the next client.

### Write your own modules

To write your own modules you just need to create a class that extends the `ClientCore` class from `@aragon/sdk-client-common` and receive the context as a parameter.

Extending the `ClientCore` class ensures that your module will have access to the `web3`, `ipfs` and `graphql` modules.

In case you want to use your custom parameters or other modules you can extend the `ClientCore` class and add your custom modules and parameters and then extend this class to have access to them.

Lets create a custom Core that extends the `ClientCore` class and adds a custom client and a custom parameter.

```ts
// src/internal/core.ts
import {ClientCore} from '@aragon/sdk-client-common';

export class MyCustomCore extends ClientCore {
  public myCustomParam: string;
  public myCustomBackendClient: MyCustomBackendClient;
  constructor(context: MyCustomContext) {
    super(context);
    this.myCustomParam = context.myCustomParam;
    this.myCustomBackendClient = new MyCustomBackendClient(context);
  }
}
```

Now using this class we can create a module that extends the `MyCustomCore` class and will have access to the `web3`, `ipfs`, `graphql` and `myCustomBackendClient` modules and the `myCustomParam` parameter.

```ts
// src/internal/modules/my-custom-methods.ts
import {MyCustomCore} from '../core';

export class MyCustomMethods extends MyCustomCore {
  constructor(context: MyCustomContext) {
    super(context);
  }

  public myCustomMethod() {
    this.web3.getProvider();
    this.ipfs.getClient();
    this.graphql.getClient();
    this.myCustomBackendClient.myCustomMethod();
    this.myCustomParam;
  }
}
```

You can also initialize other modules in your core and you will have access between them as well.

```ts
// src/internal/core.ts
import {ClientCore} from '@aragon/sdk-client-common';

export class MyCustomCore extends ClientCore {
  public myCustomParam: string;
  public myCustomBackendClient: MyCustomBackendClient;
  public methods: MyCustomMethodsModule;
  public estimation: MyCustomEstimationModule;
  constructor(context: MyCustomContext) {
    super(context);
    this.myCustomParam = context.myCustomParam;
    this.myCustomBackendClient = new MyCustomBackendClient(context);
    this.methods = new MyCustomMethodsModule(context);
    this.estimation = new MyCustomEstimationModule(context);
  }
}
```

```ts
// src/internal/modules/my-custom-methods.ts
import {MyCustomCore} from '../core';

export class MyCustomMethods extends MyCustomCore {
  constructor(context: MyCustomContext) {
    super(context);
  }

  public myCustomMethod() {
    // now here you can call other custom modules aside from the ones provided by @aragon/sdk-client-common
    this.estimation.myCustomEstimation();
  }
}
```
