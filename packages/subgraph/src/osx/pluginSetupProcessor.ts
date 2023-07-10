import {getPluginInstallationId} from '../../commons/ids';
import {
  InstallationApplied,
  InstallationPrepared,
  UninstallationApplied,
  UninstallationPrepared,
  UpdateApplied,
  UpdatePrepared,
} from '../../generated/PluginSetupProcessor/PluginSetupProcessor';
import {Dao, Plugin, PluginPreparation} from '../../generated/schema';
import {Plugin as PluginTemplate} from '../../generated/templates';
import {PLUGIN_REPO_ADDRESS} from '../../utils/constants';
import {
  updatePluginDataForInstallationApplied,
  updatePluginDataForInstallationPrepared,
  updatePluginDataForUninstallationApplied,
  updatePluginDataForUninstallationPrepared,
  updatePluginDataForUpdateApplied,
  updatePluginDataForUpdatePrepared,
  updatePreparationDataForInstallationPrepared,
  updatePreparationDataForUninstallationPrepared,
  updatePreparationDataForUpdatePrepared,
} from '../plugin/osx';
import {DataSourceContext, log} from '@graphprotocol/graph-ts';

export function handleInstallationPrepared(event: InstallationPrepared): void {
  let pluginRepo = event.params.pluginSetupRepo.toHexString();

  // Check if the prepared plugin is our plugin.
  let isThisPlugin = pluginRepo === PLUGIN_REPO_ADDRESS;

  if (!isThisPlugin) {
    return;
  }

  //////////////////////////////////////////////////////////////
  // Index DAO
  //////////////////////////////////////////////////////////////
  let daoId = event.params.dao.toHexString();
  let doaEntity = Dao.load(daoId);
  if (!doaEntity) {
    doaEntity = new Dao(daoId);
    doaEntity.save();
  }

  let dao = event.params.dao.toHexString();
  let plugin = event.params.plugin;
  let installationId = getPluginInstallationId(dao, plugin.toHexString());
  if (!installationId) {
    log.error('Failed to get installationId', [dao, plugin.toHexString()]);
    return;
  }

  //////////////////////////////////////////////////////////////
  // Index preparation
  //////////////////////////////////////////////////////////////
  let setupId = event.params.preparedSetupId.toHexString();
  let preparationId = `${installationId.toHexString()}_${setupId}`;

  let preparationEntity = new PluginPreparation(preparationId);

  // Add preparation specific data
  updatePreparationDataForInstallationPrepared(preparationEntity, event);

  preparationEntity.save();

  //////////////////////////////////////////////////////////////
  // Index plugin
  //////////////////////////////////////////////////////////////
  let pluginEntity = Plugin.load(installationId.toHexString());
  if (!pluginEntity) {
    pluginEntity = new Plugin(installationId.toHexString());
  }
  pluginEntity.dao = daoId;

  // Add plugin preparation specific data
  updatePluginDataForInstallationPrepared(pluginEntity, event);

  // Create template
  let context = new DataSourceContext();
  context.setString('daoAddress', daoId);
  PluginTemplate.createWithContext(plugin, context);

  pluginEntity.save();
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

  let pluginEntity = Plugin.load(installationId.toHexString());
  if (!pluginEntity) {
    pluginEntity = new Plugin(installationId.toHexString());
    pluginEntity.dao = daoId;
  }

  // Add plugin applied specific data
  updatePluginDataForInstallationApplied(pluginEntity, event);

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
  let preparationId = `${installationId.toHexString()}_${setupId}`;

  let preparationEntity = new PluginPreparation(preparationId);

  // Add preparation specific data
  updatePreparationDataForUpdatePrepared(preparationEntity, event);

  preparationEntity.save();

  let pluginEntity = Plugin.load(installationId.toHexString());
  if (!pluginEntity) {
    pluginEntity = new Plugin(installationId.toHexString());
    pluginEntity.dao = dao;
  }

  // Add plugin preparation specific data
  updatePluginDataForUpdatePrepared(pluginEntity, event);

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

  let pluginEntity = Plugin.load(installationId.toHexString());
  if (!pluginEntity) {
    pluginEntity = new Plugin(installationId.toHexString());
    pluginEntity.dao = dao;
  }

  // Add plugin applied specific data
  updatePluginDataForUpdateApplied(pluginEntity, event);

  pluginEntity.save();
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

  let preparationId = `${installationId.toHexString()}_${setupId}`;

  let preparationEntity = new PluginPreparation(preparationId);

  // Add preparation specific data
  updatePreparationDataForUninstallationPrepared(preparationEntity, event);

  preparationEntity.save();

  let pluginEntity = Plugin.load(installationId.toHexString());
  if (!pluginEntity) {
    pluginEntity = new Plugin(installationId.toHexString());
    pluginEntity.dao = dao;
  }

  // Add plugin preparation specific data
  updatePluginDataForUninstallationPrepared(pluginEntity, event);

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

  let pluginEntity = Plugin.load(installationId.toHexString());
  if (!pluginEntity) {
    pluginEntity = new Plugin(installationId.toHexString());
    pluginEntity.dao = dao;
  }

  // Add plugin applied specific data
  updatePluginDataForUninstallationApplied(pluginEntity, event);

  pluginEntity.save();
}
