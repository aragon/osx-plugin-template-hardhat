# Aragon OSX Plugin Template [![Hardhat][hardhat-badge]][hardhat] [![License: AGPL v3][license-badge]][license]

[hardhat]: https://hardhat.org/
[hardhat-badge]: https://img.shields.io/badge/Built%20with-Hardhat-FFDB1C.svg
[license]: https://opensource.org/licenses/AGPL-v3
[license-badge]: https://img.shields.io/badge/License-AGPL_v3-blue.svg

## Quickstart

After [creating a new repository from this template](https://github.com/new?template_name=osx-plugin-template-hardhat&template_owner=aragon), cloning, and opening it in your IDE, run

```sh
yarn install && cd packages/contracts && yarn install && yarn build && yarn typechain
```

Meanwhile, create an `.env` file from the `.env.example` file and put in the API keys for the services that you want to use.
You can now develop a plugin by changing the `src/MyPlugin.sol` and `src/MyPluginSetup.sol` files. You can directly import contracts from [Aragon OSx](https://github.com/aragon/osx) as well as OpenZeppelin's [openzeppelin-contracts](https://github.com/OpenZeppelin/openzeppelin-contracts) and [openzeppelin-contracts-upgradeable](https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable) that are already set up for you.

```sol
// SPDX-License-Identifier: AGPL-3.0-or-later
pragma solidity ^0.8.17;

import {IDAO, PluginUUPSUpgradeable} from "@aragon/osx/core/plugin/PluginUUPSUpgradeable.sol";
import {SafeCastUpgradeable} from '@openzeppelin/contracts-upgradeable/utils/math/SafeCastUpgradeable.sol';

contract MyPlugin is PluginUUPSUpgradeable {
    //...
};
```

The initial `MyPlugin` and `MyPluginSetup` example comes with unit test, integration test, and test helpers in the `package/contracts/test` folder that you can reuse.

To build and test your contracts, run

```sh
yarn clean && yarn build && yarn test
```

## Project

The root folder of the repo includes three subfolders:

```markdown
.
├── packages/contracts
│ ├── src
│ ├── deploy
│ ├── test
│ ├── utils
│ ├── ...
│ └── package.json
│
├── packages/subgraph
│ ├── src
│ ├── scripts
│ ├── manifest
│ ├── tests
│ ├── utils
│ ├── ...
│ └── package.json
│
├── packages/js-client
│ ├── src
│ ├── test
│ ├── ...
│ └── package.json
│
├── ...
└── package.json
```

The root-level `package.json` file contains global `dev-dependencies` for formatting and linting. After installing the dependencies with

```sh
yarn install
```

you can run the associated [formatting](#formatting) and [linting](#linting) commands.

### Formatting

```sh
yarn prettier:check
```

all `.sol`, `.js`, `.ts`, `.json`, and `.yml` files will be format-checked according to the specifications in `.prettierrc` file.With

```sh
yarn prettier:write
```

the formatting is applied.

### Linting

With

```sh
yarn lint
```

`.sol`, `.js`, and `.ts` files in the subfolders are analyzed with `solhint` and `eslint`, respectively.

### Setting Environment Variables

To be able to work on the contracts, make sure that you have created an `.env` file from the `.env.example` file and put in the API keys for

- [Infura](https://www.infura.io/) that we use as the web3 provider
- [Alchemy Subgraphs](https://www.alchemy.com/subgraphs) that we use as the subgraph provider
- the block explorer that you want to use depending on the networks that you want to deploy to

Before deploying, you MUST also change the default hardhat private key (`PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"`).

## Contracts

In `packages/contracts`, first run

```sh
yarn install
```

### Building

First build the contracts and

```sh
yarn build
```

and generate the [typechain TypeScript bindings](https://github.com/dethcrypto/TypeChain) with

```sh
yarn typechain
```

During development of your smart contracts, changes can result in altered typechain bindings.
You can remove the outdated build- and typechain-related files with

```sh
yarn clean
```

which will execute `yarn typechain` again. For convenience, use `yarn clean && yarn build`.

### Testing

To test your contracts, run

```sh
yarn test
```

### Linting

Lint the Solidity and TypeScript code all together with

```sh
yarn lint
```

or separately with

```sh
yarn lint:sol
```

and

```sh
yarn lint:ts
```

### Coverage

Generate the code coverage report with

```sh
yarn coverage
```

### Gas Report

See the gas usage per test and average gas per method call with

```sh
REPORT_GAS=true yarn test
```

you can permanently enable the gas reporting by putting the `REPORT_GAS=true` into the `.env` file.

### Deployment

The deploy scripts provided in this repo should already be sufficient to deploy the first and upcoming versions of your plugin.

Deploy the contracts to the local Hardhat Network with

```sh
yarn deploy
```

Deploy the contracts to sepolia with

```sh
yarn deploy --network sepolia
```

This will also create a plugin repo for the first version (`v1.1`) of your plugin.

If you want to deploy a new version of your plugin afterwards (e.g., `1.2`), simply change the `VERSION` entry in the `packages/contracts/plugin-settings.ts` file.

## Subgraph

### Installing

In `packages/subgraph`, first run

```sh
yarn install
```

which will also run

```sh
yarn postinstall
```

subsequently, to build the ABI in the `imported` folder.

### Building

Build the subgraph and

```sh
yarn build
```

which will first build the contracts (see [Contracts / Building](#building)) with

```
yarn build:contracts
```

second the subgraph manifest with

```sh
yarn build:manifest
```

and finally the subgraph itself with

```
yarn build:subgraph
```

During development of the subgraph, you might want to clean outdated files that were build, imported, and generated. To do this, run

```sh
yarn clean
```

### Testing

Test the subgraph with

```sh
yarn test
```

### Linting

Lint the TypeScript code with

```sh
yarn lint
```

### Coverage

Generate the code coverage with

```sh
yarn coverage
```

### Deployment

To deploy the subgraph to the subgraph provider, write your intended subgraph name and version into the `SUBGRAPH_NAME` and `SUBGRAPH_VERSION` variables [in the `.env` file that you created in the beginning](environment-variables) and pick a network name `SUBGRAPH_NETWORK_NAME` [being supported by the subgraph provider](https://docs.alchemy.com/reference/supported-subgraph-chains). Then run

```sh
yarn deploy
```

to deploy the subgraph and check your [Alchemy subgraph dashboard](https://subgraphs.alchemy.com/onboarding) for completion and possible errors.

## JS Client

TODO

## Template Sync

This template includes a workflow to sync the new template data into a repo created from this template.

For the workflow to function properly you need to enable the `Allow GitHub Actions to create and approve pull requests` permission in `Settings -> Actions -> General`.

To trigger the workflow go to `Actions -> Template sync` and click `Run Workflow`.

### Sync exceptions

The worklflow is not able to sync the `.templatesyncignore` file and the workflows stored in `.github/workflows`. This is because of some restrictions by the action used and how Github Actions work.

## License

This project is licensed under AGPL-3.0-or-later.
