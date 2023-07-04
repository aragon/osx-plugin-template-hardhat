import {supportsInterface} from '../../commons/erc165';
import {ERC165 as ERC165Contract} from '../../generated/PluginSetupProcessor/ERC165';
import {
  InstallationApplied,
  InstallationPrepared,
  UninstallationApplied,
  UninstallationPrepared,
  UpdateApplied,
  UpdatePrepared,
} from '../../generated/PluginSetupProcessor/PluginSetupProcessor';
import {
  Dao,
  Plugin,
  PluginPermission,
  PluginPreparation,
} from '../../generated/schema';
import {PLUGIN_INTERFACE, PLUGIN_REPO_ADDRESS} from '../utils/constants';
import {
  createPlugin,
  createPluginPreparation,
  getPluginInstallationId,
  getPluginVersionId,
  PERMISSION_OPERATIONS,
} from './utils';
import {Bytes, log} from '@graphprotocol/graph-ts';

export function handleInstallationPrepared(event: InstallationPrepared): void {
  let pluginRepo = event.params.pluginSetupRepo.toHexString();

  // Check if the prepared plugin is our plugin.
  let isThisPlugin = pluginRepo === PLUGIN_REPO_ADDRESS;

  if (!isThisPlugin) {
    return;
  }

  // Index DAO
  let daoId = event.params.dao.toHexString();
  let doaEntity = Dao.load(daoId);
  if (!doaEntity) {
    doaEntity = new Dao(daoId);
    doaEntity.save();
  }

  let plugin = event.params.plugin;

  // Index Plugin
  createPluginPreparation(event);
  createPlugin(daoId, plugin);
}

export function handleInstallationApplied(event: InstallationApplied): void {
  let daoId = event.params.dao.toHexString();
  let pluginAddress = event.params.plugin;
  let pluginId = pluginAddress.toHexString();

  // Check if the applied is our plugin.
  let installationId = getPluginInstallationId(daoId, pluginId);
  if (!installationId) {
    return;
  }

  let preparationId = `${installationId.toHexString()}_${event.params.preparedSetupId.toHexString()}`;

  let pluginEntity = Plugin.load(installationId.toHexString());
  if (!pluginEntity) {
    pluginEntity = new Plugin(installationId.toHexString());
    pluginEntity.dao = daoId;
    pluginEntity.pluginAddress = pluginAddress;
  }

  let pluginPreparationEntity = PluginPreparation.load(preparationId);
  if (pluginPreparationEntity) {
    pluginEntity.appliedPluginRepo = pluginPreparationEntity.pluginRepo;
    pluginEntity.appliedVersion = pluginPreparationEntity.pluginVersion;
  }
  pluginEntity.appliedPreparation = preparationId;
  pluginEntity.state = 'Installed';
  pluginEntity.save();
}

export function handleUpdatePrepared(event: UpdatePrepared): void {
  let dao = event.params.dao.toHexString();
  let pluginAddress = event.params.setupPayload.plugin;
  let plugin = pluginAddress.toHexString();

  // Check if the update preparation plugin is our plugin.
  let installationId = getPluginInstallationId(dao, plugin);
  if (!installationId) {
    return;
  }

  let setupId = event.params.preparedSetupId.toHexString();
  let pluginRepo = event.params.pluginSetupRepo.toHexString();

  let pluginVersionId = getPluginVersionId(
    pluginRepo,
    event.params.versionTag.release,
    event.params.versionTag.build
  );

  let preparationId = `${installationId.toHexString()}_${setupId}`;

  let helpers: Bytes[] = [];
  for (let i = 0; i < event.params.preparedSetupData.helpers.length; i++) {
    helpers.push(event.params.preparedSetupData.helpers[i]);
  }

  let preparationEntity = new PluginPreparation(preparationId);
  preparationEntity.installation = installationId.toHexString();
  preparationEntity.pluginRepo = event.params.pluginSetupRepo.toHexString();
  preparationEntity.pluginVersion = pluginVersionId;
  preparationEntity.helpers = helpers;
  preparationEntity.type = 'Update';
  preparationEntity.save();

  for (let i = 0; i < event.params.preparedSetupData.permissions.length; i++) {
    let permission = event.params.preparedSetupData.permissions[i];
    let operation = PERMISSION_OPERATIONS.get(permission.operation);
    let permissionId = `${preparationId}_${operation}_${permission.where.toHexString()}_${permission.who.toHexString()}_${permission.permissionId.toHexString()}`;
    let permissionEntity = new PluginPermission(permissionId);
    permissionEntity.pluginPreparation = preparationId;
    permissionEntity.operation = operation;
    permissionEntity.where = permission.where;
    permissionEntity.who = permission.who;
    permissionEntity.permissionId = permission.permissionId;
    if (permission.condition) {
      permissionEntity.condition = permission.condition;
    }
    permissionEntity.save();
  }

  let pluginEntity = Plugin.load(installationId.toHexString());
  if (!pluginEntity) {
    pluginEntity = new Plugin(installationId.toHexString());
    pluginEntity.dao = dao;
    pluginEntity.pluginAddress = pluginAddress;
  }

  pluginEntity.state = 'UpdatePrepared';
  pluginEntity.save();
}

export function handleUpdateApplied(event: UpdateApplied): void {
  let dao = event.params.dao.toHexString();
  let pluginAddress = event.params.plugin;
  let plugin = pluginAddress.toHexString();

  // Check if the applied update for the plugin is our plugin.
  let installationId = getPluginInstallationId(dao, plugin);
  if (!installationId) {
    return;
  }

  let preparationId = `${installationId.toHexString()}_${event.params.preparedSetupId.toHexString()}`;

  let pluginEntity = Plugin.load(installationId.toHexString());
  if (!pluginEntity) {
    pluginEntity = new Plugin(installationId.toHexString());
    pluginEntity.dao = dao;
  }

  let pluginPreparationEntity = PluginPreparation.load(preparationId);
  if (pluginPreparationEntity) {
    pluginEntity.appliedPluginRepo = pluginPreparationEntity.pluginRepo;
    pluginEntity.appliedVersion = pluginPreparationEntity.pluginVersion;
  }
  pluginEntity.pluginAddress = pluginAddress;
  pluginEntity.appliedPreparation = preparationId;
  pluginEntity.state = 'Installed';
  pluginEntity.save();

  createPlugin(dao, event.params.plugin);
}

export function handleUninstallationPrepared(
  event: UninstallationPrepared
): void {
  let dao = event.params.dao.toHexString();
  let plugin = event.params.setupPayload.plugin.toHexString();

  // Check if the prepared uninstallation is for our plugin.
  let installationId = getPluginInstallationId(dao, plugin);
  if (!installationId) {
    return;
  }

  let setupId = event.params.preparedSetupId.toHexString();
  let pluginRepo = event.params.pluginSetupRepo.toHexString();

  let pluginVersionId = getPluginVersionId(
    pluginRepo,
    event.params.versionTag.release,
    event.params.versionTag.build
  );

  let preparationId = `${installationId.toHexString()}_${setupId}`;

  let preparationEntity = new PluginPreparation(preparationId);
  preparationEntity.installation = installationId.toHexString();
  preparationEntity.pluginRepo = event.params.pluginSetupRepo.toHexString();
  preparationEntity.pluginVersion = pluginVersionId;
  preparationEntity.helpers = [];
  preparationEntity.type = 'Uninstallation';
  preparationEntity.save();

  for (let i = 0; i < event.params.permissions.length; i++) {
    let permission = event.params.permissions[i];
    let operation = PERMISSION_OPERATIONS.get(permission.operation);
    let permissionId = `${preparationId}_${operation}_${permission.where.toHexString()}_${permission.who.toHexString()}_${permission.permissionId.toHexString()}`;
    let permissionEntity = new PluginPermission(permissionId);
    permissionEntity.pluginPreparation = preparationId;
    permissionEntity.operation = operation;
    permissionEntity.where = permission.where;
    permissionEntity.who = permission.who;
    permissionEntity.permissionId = permission.permissionId;
    if (permission.condition) {
      permissionEntity.condition = permission.condition;
    }
    permissionEntity.save();
  }

  let pluginEntity = Plugin.load(installationId.toHexString());
  if (!pluginEntity) {
    pluginEntity = new Plugin(installationId.toHexString());
    pluginEntity.dao = dao;
  }
  pluginEntity.state = 'UninstallPrepared';
  pluginEntity.save();
}

export function handleUninstallationApplied(
  event: UninstallationApplied
): void {
  let dao = event.params.dao.toHexString();
  let plugin = event.params.plugin.toHexString();

  // Check if the applied uninstallation is for our plugin.
  let installationId = getPluginInstallationId(dao, plugin);
  if (!installationId) {
    return;
  }
  let preparationId = `${installationId.toHexString()}_${event.params.preparedSetupId.toHexString()}`;

  let pluginEntity = Plugin.load(installationId.toHexString());
  if (!pluginEntity) {
    pluginEntity = new Plugin(installationId.toHexString());
    pluginEntity.dao = dao;
  }
  pluginEntity.appliedPreparation = preparationId;
  pluginEntity.state = 'Uninstalled';
  pluginEntity.save();
}
