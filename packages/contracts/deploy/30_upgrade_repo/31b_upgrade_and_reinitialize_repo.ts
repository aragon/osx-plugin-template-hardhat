import {fetchData, skipUpgrade} from './_common';
import {PLUGIN_REPO_PERMISSIONS} from '@aragon/osx-commons-sdk';
import {BytesLike} from 'ethers';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

/**
 * Upgrades the plugin repo to the latest implementation and reinitializes the proxy.
 * This script MUST be called if the contract requires reinitialization  -- otherwise
 * the proxy is left unreinitialized.
 * @param {HardhatRuntimeEnvironment} hre
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployer, pluginRepo, latestPluginRepoImplementation, current} =
    await fetchData(hre);

  // Define the `_initData` arguments
  const initData: BytesLike[] = [];

  // Encode the call to `function initializeFrom(uint8[3] calldata _previousProtocolVersion, bytes calldata _initData)` with `initData`.
  const initializeFromCalldata =
    latestPluginRepoImplementation.interface.encodeFunctionData(
      // Re-initialization will happen through a call to `function initializeFrom(uint8[3] calldata _previousProtocolVersion, bytes calldata _initData)`
      // that Aragon will add to the `PluginRepo` contract once it's required.
      'initializeFrom',
      [current, initData]
    );

  // Check if deployer has the permission to upgrade the plugin repo
  if (
    await pluginRepo.isGranted(
      pluginRepo.address,
      deployer.address,
      PLUGIN_REPO_PERMISSIONS.UPGRADE_REPO_PERMISSION_ID,
      []
    )
  ) {
    // Use `upgradeToAndCall` to reinitialize the new `PluginRepo` implementation after the update.
    if (initializeFromCalldata.length > 0) {
      await pluginRepo.upgradeToAndCall(
        latestPluginRepoImplementation.address,
        initializeFromCalldata
      );
    } else {
      throw Error(
        `Initialization data is missing for 'upgradeToAndCall'. Stopping repo upgrade and reinitialization...`
      );
    }
  } else {
    throw Error(
      `The new version cannot be published because the deployer ('${deployer.address}')
      is lacking the ${PLUGIN_REPO_PERMISSIONS.UPGRADE_REPO_PERMISSION_ID} permission.`
    );
  }
};
export default func;
func.tags = ['UpgradeAndReinitializeRepo'];
func.skip = skipUpgrade;
