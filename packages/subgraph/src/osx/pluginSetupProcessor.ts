import {
  getDaoId,
  getPluginInstallationId,
  getPluginPreparationId,
} from '../../commons/ids';
import {
  InstallationApplied,
  InstallationPrepared,
  UninstallationApplied,
  UninstallationPrepared,
  UpdateApplied,
  UpdatePrepared,
} from '../../generated/PluginSetupProcessor/PluginSetupProcessor';
import {Dao, DaoPlugin} from '../../generated/schema';
import {Plugin as PluginTemplate} from '../../generated/templates';
import {PLUGIN_REPO_ADDRESS} from '../../utils/constants';
import {
  updatePluginDataForInstallationApplied,
  updatePluginDataForInstallationPrepared,
  updatePluginDataForUninstallationApplied,
  updatePluginDataForUninstallationPrepared,
  updatePluginDataForUpdateApplied,
  updatePluginDataForUpdatePrepared,
} from '../plugin/pluginSetupProcessor';
import {Address, DataSourceContext, log} from '@graphprotocol/graph-ts';

export function handleInstallationPrepared(event: InstallationPrepared): void {
  const pluginRepo = event.params.pluginSetupRepo;

  // Check if the prepared plugin is our plugin.
  const isThisPlugin = pluginRepo == Address.fromString(PLUGIN_REPO_ADDRESS);

  if (!isThisPlugin) {
    return;
  }

  //////////////////////////////////////////////////////////////
  // Index DAO
  //////////////////////////////////////////////////////////////
  const dao = event.params.dao;
  const daoId = getDaoId(dao);
  let doaEntity = Dao.load(daoId);
  if (!doaEntity) {
    doaEntity = new Dao(daoId);
    doaEntity.save();
  }

  const plugin = event.params.plugin;
  const installationId = getPluginInstallationId(dao, plugin);
  if (!installationId) {
    log.error('Failed to get installationId', [daoId, plugin.toHexString()]);
    return;
  }

  //////////////////////////////////////////////////////////////
  // Index plugin
  //////////////////////////////////////////////////////////////
  let pluginEntity = DaoPlugin.load(installationId.toHexString());
  if (!pluginEntity) {
    pluginEntity = new DaoPlugin(installationId.toHexString());
  }
  pluginEntity.dao = daoId;
  pluginEntity.pluginAddress = plugin;
  pluginEntity.pluginInstallationId = installationId;
  pluginEntity.preparationState = 'InstallationPrepared';

  // Add plugin preparation specific data
  updatePluginDataForInstallationPrepared(pluginEntity, event);

  // Create template
  const context = new DataSourceContext();
  context.setString('daoAddress', daoId);
  PluginTemplate.createWithContext(plugin, context);

  pluginEntity.save();
}

export function handleInstallationApplied(event: InstallationApplied): void {
  const dao = event.params.dao;
  const daoId = getDaoId(dao);
  const plugin = event.params.plugin;

  // Check if the applied is our plugin.
  const installationId = getPluginInstallationId(dao, plugin);
  if (!installationId) {
    return;
  }

  let pluginEntity = DaoPlugin.load(installationId.toHexString());
  if (!pluginEntity) {
    pluginEntity = new DaoPlugin(installationId.toHexString());
    pluginEntity.dao = daoId;
    pluginEntity.pluginAddress = plugin;
    pluginEntity.pluginInstallationId = installationId;
  }
  pluginEntity.preparationState = 'Installed';

  // Add plugin applied specific data
  updatePluginDataForInstallationApplied(pluginEntity, event);

  pluginEntity.save();
}

export function handleUpdatePrepared(event: UpdatePrepared): void {
  const dao = event.params.dao;
  const daoId = getDaoId(dao);
  const plugin = event.params.setupPayload.plugin;

  // Check if the update preparation plugin is our plugin.
  const installationId = getPluginInstallationId(dao, plugin);
  if (!installationId) {
    return;
  }

  let pluginEntity = DaoPlugin.load(installationId.toHexString());
  if (!pluginEntity) {
    pluginEntity = new DaoPlugin(installationId.toHexString());
    pluginEntity.dao = daoId;
    pluginEntity.pluginAddress = plugin;
    pluginEntity.pluginInstallationId = installationId;
  }
  pluginEntity.preparationState = 'UpdatePrepared';

  // Add plugin preparation specific data
  updatePluginDataForUpdatePrepared(pluginEntity, event);

  pluginEntity.save();
}

export function handleUpdateApplied(event: UpdateApplied): void {
  const dao = event.params.dao;
  const daoId = getDaoId(dao);
  const plugin = event.params.plugin;

  // Check if the applied update for the plugin is our plugin.
  const installationId = getPluginInstallationId(dao, plugin);
  if (!installationId) {
    return;
  }

  let pluginEntity = DaoPlugin.load(installationId.toHexString());
  if (!pluginEntity) {
    pluginEntity = new DaoPlugin(installationId.toHexString());
    pluginEntity.dao = daoId;
    pluginEntity.pluginAddress = plugin;
    pluginEntity.pluginInstallationId = installationId;
  }
  pluginEntity.preparationState = 'Installed';

  // Add plugin applied specific data
  updatePluginDataForUpdateApplied(pluginEntity, event);

  pluginEntity.save();
}

export function handleUninstallationPrepared(
  event: UninstallationPrepared
): void {
  const dao = event.params.dao;
  const daoId = getDaoId(dao);
  const plugin = event.params.setupPayload.plugin;

  // Check if the prepared uninstallation is for our plugin.
  const installationId = getPluginInstallationId(dao, plugin);
  if (!installationId) {
    return;
  }

  let pluginEntity = DaoPlugin.load(installationId.toHexString());
  if (!pluginEntity) {
    pluginEntity = new DaoPlugin(installationId.toHexString());
    pluginEntity.dao = daoId;
    pluginEntity.pluginAddress = plugin;
    pluginEntity.pluginInstallationId = installationId;
  }
  pluginEntity.preparationState = 'UninstallPrepared';

  // Add plugin preparation specific data
  updatePluginDataForUninstallationPrepared(pluginEntity, event);

  pluginEntity.save();
}

export function handleUninstallationApplied(
  event: UninstallationApplied
): void {
  const dao = event.params.dao;
  const daoId = getDaoId(dao);
  const plugin = event.params.plugin;

  // Check if the applied uninstallation is for our plugin.
  const installationId = getPluginInstallationId(dao, plugin);
  if (!installationId) {
    return;
  }

  let pluginEntity = DaoPlugin.load(installationId.toHexString());
  if (!pluginEntity) {
    pluginEntity = new DaoPlugin(installationId.toHexString());
    pluginEntity.dao = daoId;
    pluginEntity.pluginAddress = plugin;
    pluginEntity.pluginInstallationId = installationId;
  }
  pluginEntity.preparationState = 'Uninstalled';

  // Add plugin applied specific data
  updatePluginDataForUninstallationApplied(pluginEntity, event);

  pluginEntity.save();
}
