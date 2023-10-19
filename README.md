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

The root-level `package.json` file contains global `dev-dependencies` for formatting and linting. After installing them with

```sh
yarn install
```

you can run the associated `scripts`. With

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

or with separately with

```sh
yarn lint:sol
```

and

```sh
yarn lint:ts
```

### Coverage

Generate the code coverage report:

```sh
yarn coverage
```

### Gas Report

See the gas usage per test and average gas per method call:

```sh
REPORT_GAS=true yarn test
```

you can permanently enable the gas reporting by putting the `REPORT_GAS=true` into the `.env` file.

### Deployment

Deploy the contracts to the local Hardhat Network with

```sh
yarn deploy
```

To deploy to a network such as the Sepolia testnet, use

```sh
yarn deploy --network sepolia
```

## Subgraph

TODO

## JS Client

TODO

## License

This project is licensed under AGPL-3.0-or-later.
