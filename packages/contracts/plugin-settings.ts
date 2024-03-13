import buildMetadata from './src/build-metadata.json';
import releaseMetadata from './src/release-metadata.json';
import {generateRandomName} from './utils/helpers';
import {VersionTag} from '@aragon/osx-commons-sdk';

// Specify your plugin implementation and plugin setup contract name.
export const PLUGIN_CONTRACT_NAME = 'MyPlugin'; // See `packages/contracts/src/MyPlugin.sol`.
export const PLUGIN_SETUP_CONTRACT_NAME = 'MyPluginSetup'; // See `packages/contracts/src/MyPluginSetup.sol`.

// Pick an ENS name for your plugin. E.g., 'my-cool-plugin'.
// For more details, visit https://devs.aragon.org/docs/osx/how-it-works/framework/ens-names.
export const PLUGIN_REPO_ENS_SUBDOMAIN_NAME = generateRandomName(8);

// Specify the version of your plugin that you are currently working on. The first version is v1.1.
// For more details, visit https://devs.aragon.org/docs/osx/how-it-works/framework/plugin-management/plugin-repo.
export const VERSION: VersionTag = {
  release: 1, // Increment this number ONLY if breaking/incompatible changes were made. Updates between releases are NOT possible.
  build: 1, // Increment this number if non-breaking/compatible changes were made. Updates to newer builds are possible.
};

// The metadata associated with the plugin version you are currently working on.
// For more details, visit https://devs.aragon.org/docs/osx/how-to-guides/plugin-development/publication/metadata.
// Don't change this unless you know what you are doing.
export const METADATA = {
  build: buildMetadata,
  release: releaseMetadata,
};
