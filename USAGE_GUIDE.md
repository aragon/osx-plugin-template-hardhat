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

The `packages/contracts/test` folder contains pre-written unit and integration tests that you can adapt and extend.

#### Unit Testing

The `packages/contracts/test/integration-testing` folder contains

- plugin implementation contract unit tests in the `plugin.ts` file
- containing plugin setup contract unit tests in the `plugin-setup.ts` file

Adapt and extend the tests according to your changes and plugin features.

#### Integration Testing

The `packages/contracts/test/integration-testing` folder contains

- deployment tests in the `deployment.ts` file
  - testing that the deploy scripts publishes the plugin and sets the maintainer permissions correctly
- setup processing tests in the `setup-processing.ts` file
  - testing that Aragon OSx `PluginSetupProcessor` can install and uninstall the plugin correctly

The prior tests if your plugin can be deployed

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
