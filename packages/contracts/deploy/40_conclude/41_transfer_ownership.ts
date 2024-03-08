import {findPluginRepo, getManagementDao} from '../../utils/helpers';
import {
  DAO_PERMISSIONS,
  Operation,
  PERMISSION_MANAGER_FLAGS,
  PLUGIN_REPO_PERMISSIONS,
} from '@aragon/osx-commons-sdk';
import {DAOStructs} from '@aragon/osx-ethers';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import path from 'path';

/**
 * Creates a plugin repo under Aragon's ENS base domain with subdomain requested in the `./plugin-settings.ts` file.
 * @param {HardhatRuntimeEnvironment} hre
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  // Get PluginRepo
  const {pluginRepo, ensDomain} = await findPluginRepo(hre);
  if (pluginRepo === null) {
    throw `PluginRepo '${ensDomain}' does not exist yet.`;
  }

  // Get the management DAO address
  const managementDao = await getManagementDao(hre);
  const [deployer] = await hre.ethers.getSigners();

  console.log(
    `Transferring ownership of the '${ensDomain}' plugin repo  at '${pluginRepo.address}' from the deployer '${deployer.address}' to the management DAO at '${managementDao.address}'...`
  );

  const permissions: DAOStructs.MultiTargetPermissionStruct[] = [
    // Grant to the management DAO
    {
      operation: Operation.Grant,
      where: pluginRepo.address,
      who: managementDao.address,
      condition: PERMISSION_MANAGER_FLAGS.NO_CONDITION,
      permissionId: PLUGIN_REPO_PERMISSIONS.MAINTAINER_PERMISSION_ID,
    },
    {
      operation: Operation.Grant,
      where: pluginRepo.address,
      who: managementDao.address,
      condition: PERMISSION_MANAGER_FLAGS.NO_CONDITION,
      permissionId: PLUGIN_REPO_PERMISSIONS.UPGRADE_REPO_PERMISSION_ID,
    },
    {
      operation: Operation.Grant,
      where: pluginRepo.address,
      who: managementDao.address,
      condition: PERMISSION_MANAGER_FLAGS.NO_CONDITION,
      permissionId: DAO_PERMISSIONS.ROOT_PERMISSION_ID,
    },
    // Revoke from deployer
    {
      operation: Operation.Revoke,
      where: pluginRepo.address,
      who: deployer.address,
      condition: PERMISSION_MANAGER_FLAGS.NO_CONDITION,
      permissionId: PLUGIN_REPO_PERMISSIONS.MAINTAINER_PERMISSION_ID,
    },
    {
      operation: Operation.Revoke,
      where: pluginRepo.address,
      who: deployer.address,
      condition: PERMISSION_MANAGER_FLAGS.NO_CONDITION,
      permissionId: PLUGIN_REPO_PERMISSIONS.UPGRADE_REPO_PERMISSION_ID,
    },
    {
      operation: Operation.Revoke,
      where: pluginRepo.address,
      who: deployer.address,
      condition: PERMISSION_MANAGER_FLAGS.NO_CONDITION,
      permissionId: DAO_PERMISSIONS.ROOT_PERMISSION_ID,
    },
  ];

  await pluginRepo.connect(deployer).applyMultiTargetPermissions(permissions);
};

export default func;
func.tags = ['TransferOwnershipToManagmentDao'];

/**
 * Skips the transfer of ownership if it has already been transferred to the management DAO
 * @param {HardhatRuntimeEnvironment} hre
 */
func.skip = async (hre: HardhatRuntimeEnvironment) => {
  console.log(`\n🏗️  ${path.basename(__filename)}:`);

  const {pluginRepo, ensDomain} = await findPluginRepo(hre);
  if (pluginRepo === null) {
    throw `PluginRepo '${ensDomain}' does not exist yet.`;
  }
  const managementDao = await getManagementDao(hre);

  const mgmtDaoHasRootPerm = await pluginRepo.isGranted(
    pluginRepo.address,
    managementDao.address,
    DAO_PERMISSIONS.ROOT_PERMISSION_ID,
    []
  );

  if (mgmtDaoHasRootPerm)
    console.log(
      `The ownership of the plugin repo '${ensDomain}' has already been transferred to the management DAO. Skipping...`
    );

  return mgmtDaoHasRootPerm;
};
