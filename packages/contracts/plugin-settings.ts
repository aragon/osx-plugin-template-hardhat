import buildMetadata from './src/build-metadata.json';
import releaseMetadata from './src/release-metadata.json';

export const PLUGIN_CONTRACT_NAME = 'MyPlugin'; // This must match the filename `packages/contracts/src/MyPlugin.sol` and the contract name `MyPlugin` within.
export const PLUGIN_SETUP_CONTRACT_NAME = 'MyPluginSetup'; // This must match the filename `packages/contracts/src/MyPluginSetup.sol` and the contract name `MyPluginSetup` within.
export const PLUGIN_REPO_ENS_NAME = 'my'; // Subdomain Name 'my.plugin.dao.eth'

export const VERSION = {
  release: 1, // Increment this number ONLY if breaking/incompatible changes were made. Updates between releases are NOT possible.
  build: 1, // Increment this number if non-breaking/compatible changes were made. Updates to newer builds are possible.
};

export const METADATA = {
  build: buildMetadata,
  release: releaseMetadata,
};
