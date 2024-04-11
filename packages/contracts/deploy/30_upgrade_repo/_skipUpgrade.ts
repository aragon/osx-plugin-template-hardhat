import {findPluginRepo, getProductionNetworkName} from '../../utils/helpers';
import {
  getLatestNetworkDeployment,
  getNetworkNameByAlias,
} from '@aragon/osx-commons-configs';
import {UnsupportedNetworkError} from '@aragon/osx-commons-sdk';
import {PluginRepo__factory} from '@aragon/osx-ethers';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import path from 'path';

export type SemVer = [number, number, number];

/**
 * Skips the plugin repo upgrade if exists in the plugin repo.
 * @param {HardhatRuntimeEnvironment} hre
 */
export const skipUpgrade = async (hre: HardhatRuntimeEnvironment) => {
  console.log(`\n🏗️  ${path.basename(__filename)}:`);

  const [deployer] = await hre.ethers.getSigners();
  const productionNetworkName: string = getProductionNetworkName(hre);
  const network = getNetworkNameByAlias(productionNetworkName);
  if (network === null) {
    throw new UnsupportedNetworkError(productionNetworkName);
  }
  const networkDeployments = getLatestNetworkDeployment(network);
  if (networkDeployments === null) {
    throw `Deployments are not available on network ${network}.`;
  }

  // Get the latest `PluginRepo` implementation as the upgrade target
  const latestPluginRepoImplementation = PluginRepo__factory.connect(
    networkDeployments.PluginRepoBase.address,
    deployer
  );

  const {pluginRepo, ensDomain} = await findPluginRepo(hre);
  if (pluginRepo === null) {
    throw `PluginRepo '${ensDomain}' does not exist yet.`;
  }

  // Compare the current protocol version of the `PluginRepo`
  let current: SemVer;
  try {
    current = await pluginRepo.protocolVersion();
  } catch {
    current = [1, 0, 0];
  }
  const target: SemVer = await latestPluginRepoImplementation.protocolVersion();

  // Throw an error if attempting to upgrade to an earlier version
  if (
    current[0] > target[0] ||
    current[1] > target[1] ||
    current[2] > target[2]
  ) {
    throw `The plugin repo, currently at 'v${current[0]}.${current[1]}.${current[2]}' cannot be upgraded to the earlier version v${target[0]}.${target[1]}.${target[2]}.`;
  }

  // Skip if versions are equal
  if (JSON.stringify(current) == JSON.stringify(target)) {
    console.log(
      `PluginRepo '${ensDomain}' (${pluginRepo.address}) has already been upgraded to 
      the current protocol version v${target[0]}.${target[1]}.${target[2]}. Skipping upgrade...`
    );
    return true;
  }

  return false;
};
