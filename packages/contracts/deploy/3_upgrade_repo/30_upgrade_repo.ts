import {PLUGIN_REPO_ENS_NAME} from '../../plugin-settings';
import {
  getProductionNetworkName,
  getAragonDeploymentsInfo,
} from '../../utils/helpers';
import {
  getLatestNetworkDeployment,
  getNetworkNameByAlias,
} from '@aragon/osx-commons-configs';
import {PLUGIN_REPO_PERMISSIONS} from '@aragon/osx-commons-sdk';
import {PluginRepo__factory} from '@aragon/osx-ethers';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import path from 'path';

type SemVer = [number, number, number];

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {network} = hre;
  const [deployer] = await hre.ethers.getSigners();
  const productionNetworkName: string = getProductionNetworkName(hre);

  const pluginRepo = PluginRepo__factory.connect(
    getAragonDeploymentsInfo(network.name)[network.name]['address'],
    deployer
  );

  console.log(
    `Upgrading plugin repo '${PLUGIN_REPO_ENS_NAME}.plugin.dao.eth' (${pluginRepo.address})...`
  );

  const newPluginRepoImplementation = PluginRepo__factory.connect(
    getLatestNetworkDeployment(getNetworkNameByAlias(productionNetworkName)!)!
      .PluginRepoBase.address,
    deployer
  );

  // TODO Use the `getProtocolVersion` function from osx-commons-sdk
  let current: SemVer;
  try {
    current = await pluginRepo.protocolVersion();
  } catch {
    current = [1, 0, 0];
  }

  const latest: SemVer = await newPluginRepoImplementation.protocolVersion();

  console.log(
    `Upgrading from current protocol version v${current[0]}.${current[1]}.${current[2]} to the new version v${latest[0]}.${latest[1]}.${latest[2]}.`
  );

  // Prepare optional initialization data

  // TODO Add `initializeFrom` function to `PluginRepo`.
  const initializeFromCalldata: unknown[] = [];
  /*
  const initData: unknown[] = [];
  const initializeFromCalldata =
    newPluginRepoImplementation.interface.encodeFunctionData('initializeFrom', [
      current,
      initData,
    ]);
  */

  // Check if deployer has the permission to upgrade the plugin repo
  if (
    await pluginRepo.isGranted(
      pluginRepo.address,
      deployer.address,
      PLUGIN_REPO_PERMISSIONS.UPGRADE_REPO_PERMISSION_ID,
      []
    )
  ) {
    // Use `upgradeToAndCall` if the new implementation must be initialized by calling
    // function initializeFrom(uint8[3] calldata _previousProtocolVersion, bytes calldata _initData) external reinitializer(x)
    // on the `PluginRepo` prox.
    // Else, we use `upgradeTo`.
    if (initializeFromCalldata.length > 0) {
      await pluginRepo.upgradeToAndCall(
        newPluginRepoImplementation.address,
        initializeFromCalldata
      );
    } else {
      await pluginRepo.upgradeTo(newPluginRepoImplementation.address);
    }
  } else {
    throw Error(
      `The new version cannot be published because the deployer ('${deployer.address}')
      is lacking the ${PLUGIN_REPO_PERMISSIONS.UPGRADE_REPO_PERMISSION_ID} permission.`
    );
  }
};
export default func;
func.tags = ['UpgradeRepo'];
func.skip = async (hre: HardhatRuntimeEnvironment) => {
  console.log(`\n🏗️  ${path.basename(__filename)}:`);

  const [deployer] = await hre.ethers.getSigners();
  const productionNetworkName: string = getProductionNetworkName(hre);

  const newPluginRepoImplementation = PluginRepo__factory.connect(
    getLatestNetworkDeployment(getNetworkNameByAlias(productionNetworkName)!)!
      .PluginRepoBase.address,
    deployer
  );

  const pluginRepo = PluginRepo__factory.connect(
    getAragonDeploymentsInfo(hre.network.name)[hre.network.name]['address'],
    deployer
  );

  // Compare the current protocol version of the `PluginRepo`
  // TODO Use the `getProtocolVersion` function from osx-commons-sdk
  let current: SemVer;
  try {
    current = await pluginRepo.protocolVersion();
  } catch {
    current = [1, 0, 0];
  }
  current = [1, 0, 0];
  const latest: SemVer = await newPluginRepoImplementation.protocolVersion();

  console.log(current, latest);
  // Compare versions
  if (JSON.stringify(current) == JSON.stringify(latest)) {
    console.log(
      `PluginRepo '${PLUGIN_REPO_ENS_NAME}.plugin.dao.eth' (${pluginRepo.address}) has already been upgraded to 
      the current protocol version v${latest[0]}.${latest[1]}.${latest[2]}. Skipping upgrade...`
    );
    return true;
  }

  return false;
};
