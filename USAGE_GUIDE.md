# Developing a Plugin

## Contracts

### Writing your Plugin

1. Go to the `packages/contracts/src` folder and

   - adapt and rename the `MyPlugin.sol` plugin implementation contract (see [our docs](https://devs.aragon.org/docs/osx/how-to-guides/plugin-development/upgradeable-plugin/implementation)).
   - adapt and rename the `MyPluginSetup.sol` plugin setup contract (see [our docs](https://devs.aragon.org/docs/osx/how-to-guides/plugin-development/upgradeable-plugin/setup)).

2. Once finished, adapt the

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

Go to the `packages/contracts/test` folder and

#### Unit Testing

Go to the `packages/contracts/test/unit-testing` folder and

- adapt the `plugin.ts` plugin implementation contract
- adapt the `plugin-setup.ts` plugin setup contract (see [our docs](https://devs.aragon.org/docs/osx/how-to-guides/plugin-development/upgradeable-plugin/setup)).

#### Integration Testing

The `packages/contracts/test/integration-testing` contains

- the `setup-processing.ts` setup processing tests
- `deployment.ts` deployment tests

The integration tests already provided will test if you plugin setup can in the `packages/contracts/deploy` should already be sufficient to deploy the first version of your plugin, e.g. to sepolia via

Go to the `packages/contracts/test/integration-testing` folder and

- adapt the `setup-processing.ts` setup processing tests

- adapt the `deployment.ts` deployment tests

### Deployment Scripts

The standard deploy scripts in the `packages/contracts/deploy` should already be sufficient to deploy the first and upcoming versions of your plugin. If your deployment has special requirements, adapt the files.

- `00_info/01_account_info.ts`
  - prints information on the used account and its balance
- `01_repo/10_create_repo.ts`
  - creates a plugin repo with an ENS subdomain name under the `plugin.dao.eth` parent domain if the ENS name is not taken already.
- `02_setup/10_setup.ts`
  - deploys the plugin setup contract
- `02_setup/10_setup_conclude.ts`
  - fetches the plugin setup contract and included implementation contract for Etherscan verifcation
- `02_setup/12_publish.ts`
  - publishes the plugin setup contract on the plugin repo created in `01_repo/10_create_repo.ts`
- `99_verification/10_verify-contracts.ts`
  - verifies all deployed contracts
