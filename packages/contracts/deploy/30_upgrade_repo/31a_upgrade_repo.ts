import {fetchData, skipUpgrade} from './_common';
import {PLUGIN_REPO_PERMISSIONS} from '@aragon/osx-commons-sdk';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

/**
 * Upgrades the plugin repo to the latest implementation.
 * This script CAN be called if the contract does not require reinitialization.
 * It MUST NOY be called if the contract requires reinitialization, because this
 * would leave the proxy unreinitialized.
 * @param {HardhatRuntimeEnvironment} hre
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployer, pluginRepo, latestPluginRepoImplementation} =
    await fetchData(hre);

  // Check if deployer has the permission to upgrade the plugin repo
  if (
    await pluginRepo.isGranted(
      pluginRepo.address,
      deployer.address,
      PLUGIN_REPO_PERMISSIONS.UPGRADE_REPO_PERMISSION_ID,
      []
    )
  ) {
    await pluginRepo.upgradeTo(latestPluginRepoImplementation.address);
  } else {
    throw Error(
      `The new version cannot be published because the deployer ('${deployer.address}')
      is lacking the ${PLUGIN_REPO_PERMISSIONS.UPGRADE_REPO_PERMISSION_ID} permission.`
    );
  }
};
export default func;
func.tags = ['UpgradeRepo'];
func.skip = skipUpgrade;
