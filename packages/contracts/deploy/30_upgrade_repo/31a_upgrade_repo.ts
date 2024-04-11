import {findPluginRepo, getProductionNetworkName} from '../../utils/helpers';
import {SemVer, skipUpgrade} from './_skipUpgrade';
import {
  getLatestNetworkDeployment,
  getNetworkNameByAlias,
} from '@aragon/osx-commons-configs';
import {
  PLUGIN_REPO_PERMISSIONS,
  UnsupportedNetworkError,
} from '@aragon/osx-commons-sdk';
import {PluginRepo__factory} from '@aragon/osx-ethers';
import {BytesLike} from 'ethers';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

/**
 * Upgrades the plugin repo to the latest implementation.
 * @param {HardhatRuntimeEnvironment} hre
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
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

  // Get PluginRepo
  const {pluginRepo, ensDomain} = await findPluginRepo(hre);
  if (pluginRepo === null) {
    throw `PluginRepo '${ensDomain}' does not exist yet.`;
  }

  console.log(
    `Upgrading plugin repo '${ensDomain}' (${pluginRepo.address})...`
  );

  // Get the latest `PluginRepo` implementation as the upgrade target
  const latestPluginRepoImplementation = PluginRepo__factory.connect(
    networkDeployments.PluginRepoBase.address,
    deployer
  );

  // Get the current OSX protocol version from the current plugin repo implementation
  let current: SemVer;
  try {
    current = await pluginRepo.protocolVersion();
  } catch {
    current = [1, 0, 0];
  }

  // Get the OSX protocol version from the latest plugin repo implementation
  const latest: SemVer = await latestPluginRepoImplementation.protocolVersion();

  console.log(
    `Upgrading from current protocol version v${current[0]}.${current[1]}.${current[2]} to the latest version v${latest[0]}.${latest[1]}.${latest[2]}.`
  );

  // NOTE: The following code can be uncommented and `initData` can be filled
  // with arguments in case re-initialization of the `PluginRepo` should become necessary.
  // Re-initialization will happen through a call to `function initializeFrom(uint8[3] calldata _previousProtocolVersion, bytes calldata _initData)`
  // that Aragon might add to the `PluginRepo` contract once it's required.
  /*
  // Define the `_initData` arguments 
  const initData: BytesLike[] = [];
  // Encode the call to `function initializeFrom(uint8[3] calldata _previousProtocolVersion, bytes calldata _initData)` with `initData`
  const initializeFromCalldata =
    latestPluginRepoImplementation.interface.encodeFunctionData('initializeFrom', [
      current,
      initData,
    ]);
  */
  const initializeFromCalldata: BytesLike = [];

  // Check if deployer has the permission to upgrade the plugin repo
  if (
    await pluginRepo.isGranted(
      pluginRepo.address,
      deployer.address,
      PLUGIN_REPO_PERMISSIONS.UPGRADE_REPO_PERMISSION_ID,
      []
    )
  ) {
    // Use `upgradeToAndCall` if the new implementation must be re-initialized by calling
    // on the `PluginRepo` proxy. If not, we use `upgradeTo`.
    if (initializeFromCalldata.length > 0) {
      await pluginRepo.upgradeToAndCall(
        latestPluginRepoImplementation.address,
        initializeFromCalldata
      );
    } else {
      await pluginRepo.upgradeTo(latestPluginRepoImplementation.address);
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
func.skip = skipUpgrade;
