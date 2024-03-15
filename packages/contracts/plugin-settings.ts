import buildMetadata from './src/build-metadata.json';
import releaseMetadata from './src/release-metadata.json';
import {VersionTag} from '@aragon/osx-commons-sdk';

export const PLUGIN_CONTRACT_NAME = 'Multisig';
export const PLUGIN_SETUP_CONTRACT_NAME = 'MultisigSetup';
export const PLUGIN_REPO_ENS_SUBDOMAIN_NAME = 'multisig'; // 'multisig.plugin.dao.eth'

// Specify the version of your plugin that you are currently working on. The first version is v1.1.
// For more details, visit https://devs.aragon.org/docs/osx/how-it-works/framework/plugin-management/plugin-repo.
export const VERSION: VersionTag = {
  release: 1, // Increment this number ONLY if breaking/incompatible changes were made. Updates between releases are NOT possible.
  build: 3, // Increment this number if non-breaking/compatible changes were made. Updates to newer builds are possible.
};

export const METADATA = {
  build: buildMetadata,
  release: releaseMetadata,
};
