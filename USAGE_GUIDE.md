# Template Usage Guide

This guide will walk you through the process of writing the smart contract for a plugin and also creating the subgraph. It will cover the following topics:

- [Dependency Installation](#dependency-installation)
- [Contracts](#contracts)

  - [Adapt the contracts](#adapt-template-contracts)
  - [testing](#testing)
    - [Unit Testing](#unit-testing)
    - [Integration Testing](#integration-testing)
  - [Deployment Scripts](#deployment-scripts)

- [Subgraph](#subgraph)
  - [Included scripts and `.env` file](#included-scripts-and-env-file)
  - [Creating a Subgraph](#creating-a-subgraph)
    - [`manifest/subgraph.placeholder.yaml`](#manifestsubgraphplaceholderyaml)
    - [`schema.graphql`](#schemagraphql)
  - [Handlers](#handlers)
  - [testing](#testing-1)

## Dependency Installation

Before you begin, make sure you installed the necessary dependencies.
For detailed instructions, refer to the [README](README.md).

# Contracts

## Adapt template contracts

This template contains the boilerplate and it uses `MyPlugin` as the contracts names, in order to adapt them according to your needs follow the following steps:

1. Go to the `packages/contracts/src` folder and

   - adapt and rename the `MyPlugin.sol` plugin implementation contract (see [our docs](https://devs.aragon.org/docs/osx/how-to-guides/plugin-development/upgradeable-plugin/implementation)).
   - adapt and rename the `MyPluginSetup.sol` plugin setup contract (see [our docs](https://devs.aragon.org/docs/osx/how-to-guides/plugin-development/upgradeable-plugin/setup)).

2. adapt the release and build metadata for the plugin:

   - `build-metadata.json` and
   - `release-metadata.json`

   in the same folder. [Check our documentation](https://devs.aragon.org/docs/osx/how-to-guides/plugin-development/publication/metadata) on what the metadata files are about.

3. Finally, write the file names into the `packages/contracts/plugin-settings.ts` file and pick an ENS subdomain name according to the rules described in [our docs on ENS subdomain names](https://devs.aragon.org/docs/osx/how-it-works/framework/ens-names).

   ```ts
   export const PLUGIN_CONTRACT_NAME = 'MyPlugin'; // Replace this with plugin contract name you chose
   export const PLUGIN_SETUP_CONTRACT_NAME = 'MyPluginSetup'; // Replace this with the plugin setup contract name you chose.
   export const PLUGIN_REPO_ENS_NAME = 'my'; // Pick an ENS subdomain name under that will live under `plugin.dao.eth` domain (e.g., 'my' will result in 'my.plugin.dao.eth') for the plugin repository that will be created during deployment. Make sure that the subdomain is not already taken on the chain(s) you are planning to deploy to.
   ```

   When deploying the first version of your plugin, you don't need to change the following lines.

   ```ts
   export const VERSION = {
     release: 1, // Increment this number ONLY if breaking/incompatible changes were made. Updates between releases are NOT possible.
     build: 1, // Increment this number if non-breaking/compatible changes were made. Updates to newer builds are possible.
   };
   ```

   If you deploy upcoming versions of your plugin, you must increment the build or release number accordingly (see [our docs on versioning your plugin](https://devs.aragon.org/docs/osx/how-to-guides/plugin-development/publication/versioning)).

### Testing

The `packages/contracts/test` folder contains pre-written unit and integration tests that you can adapt and extend.

#### Unit Testing

The `packages/contracts/test/10_unit-testing` folder contains

- plugin implementation contract unit tests in the `11_plugin.ts` file
- containing plugin setup contract unit tests in the `12_plugin-setup.ts` file

Adapt and extend the tests according to your changes and plugin features.

#### Integration Testing

The `packages/contracts/test/20_integration-testing` folder contains

- deployment tests in the `21_deployment.ts` file
  - testing that the deploy scripts publishes the plugin and sets the maintainer permissions correctly
- setup processing tests in the `22_setup-processing.ts` file
  - testing that Aragon OSx `PluginSetupProcessor` can [apply a plugin setup](https://devs.aragon.org/docs/osx/how-it-works/framework/plugin-management/plugin-setup/#what-happens-during-the-preparation-application) correctly

The prior tests if your plugin can be deployed

### Deployment Scripts

The standard deploy scripts in the `packages/contracts/deploy` should already be sufficient to deploy the first and upcoming versions of your plugin as well as upgrade your plugin repo. If your deployment has special requirements, adapt the files.

- `00_info/01_account_info.ts`
  - Prints information on the used networks and used account.
- `10_create_repo/11_create_repo.ts`
  - Creates a plugin repo with an ENS subdomain name under the `plugin.dao.eth` parent domain if the ENS name is not taken already.
- `20_new_version/21_setup.ts`
  - Deploys the plugin setup contract
- `20_new_version/22_setup_conclude.ts`
  - Fetches the plugin setup and implementation contract and queues it for block explorer verification.
- `20_new_version/23_publish.ts`
  - Publishes the plugin setup contract on the plugin repo created in `10_repo/11_create_repo.ts`
- `30_upgrade_repo/31a_upgrade_and_reinitialize_repo.ts`
  - Upgrades the plugin repo to the latest Aragon OSx protocol version and reinitializes it.
- `30_upgrade_repo/31b_upgrade_repo.ts`
  - Upgrades the plugin repo to the latest Aragon OSx protocol version.
- `40_conclude/41_conclude.ts`
  - Prints information on the used account's balance after deployment.
- `50_verification/51_verify_contracts.ts`
  - Verifies all deployed contracts.

# Subgraph

## Included scripts and `.env` file

The current repo contains a set of 3 scripts to help you get started with your subgraph. These scripts are located in the `scripts` folder and are the following:

- `build-manifest.sh`: Builds the `subgraph.yaml` file from the `subgraph.template.yaml` file.
- `build-subgraph.sh`: Builds the subgraph from the `subgraph.yaml` file generated by the `build-manifest.sh` script.
- `deploy-subgraph.sh`: Deploys the subgraph.

These 3 scripts can be called with the `yarn` command:

```bash
# Build the subgraph.yaml file
yarn build:manifest
# Build the subgraph
yarn build:subgraph
# Deploy the subgraph
yarn deploy
```

**REMEMBER**: You need to build the contracts before building the subgraph. You can do that by running `yarn build:contracts`

If you use `yarn build` it will build the contracts, the subgraph.yaml file and the subgraph in that order.

This scripts depend on the `.env` file located in the root of the repo. This file contains some variables that are relevant for this scripts. The variables are the following:

```bash
# SUBGRAPH

## The Graph credentials
GRAPH_KEY="zzzzzzzzzzzz"

## Subgraph
SUBGRAPH_NAME="osx"
SUBGRAPH_VERSION="v1.0.0"
SUBGRAPH_NETWORK_NAME="mainnet" #  ["mainnet", "sepolia", "polygon", "base", "arbitrum"]
```

- `GRAPH_KEY`: This key will be used for deploying the subgraph.
- `SUBGRAPH_NAME`: The name of the subgraph.
- `SUBGRAPH_VERSION`: The version of the subgraph.
- `SUBGRAPH_NETWORK_NAME`: The network where the subgraph will be deployed. This will be used for generating the subgraph.yaml file.

Editing this variables you can change how the subgraph is built and deployed.

## Creating a Subgraph

### `manifest/subgraph.placeholder.yaml`

The first step to create a subgraph is to create or edit the `subgraph.placeholder.yaml` file. This file is located in the `manifest` folder. This file contains the template for the `subgraph.yaml` file. This file is used by the `build-manifest.sh` script to generate the `subgraph.yaml` file. You can find more information about the `subgraph.yaml` file [here](https://thegraph.com/docs/define-a-subgraph#the-subgraph-manifest).

You will see that the `subgraph.placeholder.yaml` file contains some placeholders that will be replaced by the `build-manifest.sh` script. These placeholders are the following:

- `{{dataSources.PluginSetupProcessors}}`: The object containing the processors for the plugin setup events.
- `{{startBlock}}`: The block number where the subgraph will start indexing.
- `{{address}}`: The address of the contract that will be indexed.
- `{{network}}`: The network where the contract is deployed.

These placeholders are substituted using [mustache](https://mustache.github.io/).

The files containing the replacement values are stored in `manifest/data`. Here you can find a JSON file for each network. The name of the file is the name of the network. For example, the file for the mainnet network is `mainnet.json`. This file contains a property called `dataSources` which holds the information about the contract that will be indexed. In this case, we are only indexing one contract but you can index multiple contracts by adding more objects to the `dataSources` object.

### `schema.graphql`

The second step to create a subgraph is to define the schema. The schema is defined in the `schema.graphql` file located in the `subgraph` folder. This file contains the GraphQL schema that will be used for querying the subgraph. The schema is defined using the GraphQL Schema Definition Language (SDL). You can find more information about it [here](https://graphql.org/learn/schema/).

Here you can add your custom entities and how they are related to each other. You can find more information about the schema [here](https://thegraph.com/docs/define-a-subgraph#defining-the-schema).

## Handlers

Events handler functions are associated with the events in the `subgraph.yaml` file and defined in the `src` folder.

The `src` folder contains a `plugin` and `osx` subfolder.
In `plugin.ts` inside the `plugin` folder, you can add plugin-related event handlers.
In `pluginSetupProcessor.ts` inside the `osx` folder, you can add plugin-setup-processor-related event handlers that your plugin might require.

For the `MyPlugin` example, two handlers are already provided:

- `handleInstallationPrepared`: Handles the `InstallationPrepared` event. This event is emitted when the installation is prepared. This event contains the `installationId` and the handler will create a new `PluginEntity` entity with the `installationId` as the id.
- `handleNumberStored`: Handles the `NumberStored` event. And stores the number in the `pluginEntity` entity in the `number` property.

## Testing

This template uses [matchstick-as](https://github.com/LimeChain/matchstick) framework for unit testing.
Similar to the `src` folder, the `test` folder contains a `plugin` and `osx` subfolder, where the tests for the event handlers from the previous section are written.

In `plugin.test.ts` inside the `plugin` folder, you can test the plugin-related event handlers. In `pluginSetupProcessor.test.ts` inside the `osx` folder, you can test plugin-setup-processor-related event handlers that your plugin might require.
