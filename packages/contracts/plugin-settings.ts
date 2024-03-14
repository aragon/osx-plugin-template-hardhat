import buildMetadata from './src/build-metadata.json';
import releaseMetadata from './src/release-metadata.json';
import {GovernanceERC20} from './test/test-utils/typechain-versions';
import {VersionTag} from '@aragon/osx-commons-sdk';
import {ethers} from 'hardhat';

export const PLUGIN_CONTRACT_NAME = 'TokenVoting'; // This must match the filename `packages/contracts/src/MyPlugin.sol` and the contract name `MyPlugin` within.
export const PLUGIN_SETUP_CONTRACT_NAME = 'TokenVotingSetup'; // This must match the filename `packages/contracts/src/MyPluginSetup.sol` and the contract name `MyPluginSetup` within.
export const PLUGIN_REPO_ENS_SUBDOMAIN_NAME = 'token-voting'; // This will result in the ENS domain name 'my.plugin.dao.eth'

export const GOVERNANCE_ERC20_CONTRACT_NAME = 'GovernanceERC20';
export const GOVERNANCE_WRAPPED_ERC20_CONTRACT_NAME = 'GovernanceWrappedERC20';

export const VERSION: VersionTag = {
  release: 1, // Increment this number ONLY if breaking/incompatible changes were made. Updates between releases are NOT possible.
  build: 3, // Increment this number if non-breaking/compatible changes were made. Updates to newer builds are possible.
};

/* DO NOT CHANGE UNLESS YOU KNOW WHAT YOU ARE DOING */
export const METADATA = {
  build: buildMetadata,
  release: releaseMetadata,
};

const zeroDaoAddress = ethers.constants.AddressZero;
const zeroTokenAddress = ethers.constants.AddressZero;
const emptyName = '';
const emptySymbol = '';

export const emptyMintSettings: GovernanceERC20.MintSettingsStruct = {
  receivers: [],
  amounts: [],
};

export const GOVERNANCE_ERC20_DEPLOY_ARGS = [
  zeroDaoAddress,
  emptyName,
  emptySymbol,
  emptyMintSettings,
];

export const GOVERNANCE_WRAPPED_ERC20_DEPLOY_ARGS = [
  zeroTokenAddress,
  emptyName,
  emptySymbol,
];
