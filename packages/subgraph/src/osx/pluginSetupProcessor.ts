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
} from '../plugin/pluginSetupProcessor';
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
  let dao = event.params.dao;
  let daoId = getDaoId(dao);
  let doaEntity = Dao.load(daoId);
  if (!doaEntity) {
    doaEntity = new Dao(daoId);
    doaEntity.save();
  }

  let plugin = event.params.plugin;
  let installationId = getPluginInstallationId(dao, plugin);
  if (!installationId) {
    log.error('Failed to get installationId', [daoId, plugin.toHexString()]);
    return;
  }

  //////////////////////////////////////////////////////////////
  // Index preparation
  //////////////////////////////////////////////////////////////
  let setupId = event.params.preparedSetupId;
  let preparationId = getPluginPreparationId(dao, plugin, setupId);
  if (preparationId) {
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
  } else {
    log.error('Failed to get preparationId for dao {}, plugin {}, setupId {}', [
      daoId,
      plugin.toHexString(),
      setupId.toHexString(),
    ]);
    return;
  }
}

export function handleInstallationApplied(event: InstallationApplied): void {
  let dao = event.params.dao;
  let plugin = event.params.plugin;

  // Check if the applied is our plugin.
  let installationId = getPluginInstallationId(dao, plugin);
  if (!installationId) {
    return;
  }

  let pluginEntity = Plugin.load(installationId.toHexString());
  if (!pluginEntity) {
    pluginEntity = new Plugin(installationId.toHexString());
    pluginEntity.dao = getDaoId(dao);
  }

  // Add plugin applied specific data
  updatePluginDataForInstallationApplied(pluginEntity, event);

  pluginEntity.save();
}

export function handleUpdatePrepared(event: UpdatePrepared): void {
  let dao = event.params.dao;
  let plugin = event.params.setupPayload.plugin;

  // Check if the update preparation plugin is our plugin.
  let installationId = getPluginInstallationId(dao, plugin);
  if (!installationId) {
    return;
  }

  let setupId = event.params.preparedSetupId;
  let preparationId = getPluginPreparationId(dao, plugin, setupId);
  if (preparationId) {
    let preparationEntity = new PluginPreparation(preparationId);

    // Add preparation specific data
    updatePreparationDataForUpdatePrepared(preparationEntity, event);

    preparationEntity.save();

    let pluginEntity = Plugin.load(installationId.toHexString());
    if (!pluginEntity) {
      pluginEntity = new Plugin(installationId.toHexString());
      pluginEntity.dao = getDaoId(dao);
    }

    // Add plugin preparation specific data
    updatePluginDataForUpdatePrepared(pluginEntity, event);

    pluginEntity.save();
  } else {
    log.error('Failed to get preparationId for dao {}, plugin {}, setupId {}', [
      dao.toHexString(),
      plugin.toHexString(),
      setupId.toHexString(),
    ]);
    return;
  }
}

export function handleUpdateApplied(event: UpdateApplied): void {
  let dao = event.params.dao;
  let plugin = event.params.plugin;

  // Check if the applied update for the plugin is our plugin.
  let installationId = getPluginInstallationId(dao, plugin);
  if (!installationId) {
    return;
  }

  let pluginEntity = Plugin.load(installationId.toHexString());
  if (!pluginEntity) {
    pluginEntity = new Plugin(installationId.toHexString());
    pluginEntity.dao = getDaoId(dao);
  }

  // Add plugin applied specific data
  updatePluginDataForUpdateApplied(pluginEntity, event);

  pluginEntity.save();
}

export function handleUninstallationPrepared(
  event: UninstallationPrepared
): void {
  let dao = event.params.dao;
  let plugin = event.params.setupPayload.plugin;

  // Check if the prepared uninstallation is for our plugin.
  let installationId = getPluginInstallationId(dao, plugin);
  if (!installationId) {
    return;
  }

  let setupId = event.params.preparedSetupId;

  let preparationId = getPluginPreparationId(dao, plugin, setupId);
  if (preparationId) {
    let preparationEntity = new PluginPreparation(preparationId);

    // Add preparation specific data
    updatePreparationDataForUninstallationPrepared(preparationEntity, event);

    preparationEntity.save();

    let pluginEntity = Plugin.load(installationId.toHexString());
    if (!pluginEntity) {
      pluginEntity = new Plugin(installationId.toHexString());
      pluginEntity.dao = getDaoId(dao);
    }

    // Add plugin preparation specific data
    updatePluginDataForUninstallationPrepared(pluginEntity, event);

    pluginEntity.save();
  } else {
    log.error('Failed to get preparationId for dao {}, plugin {}, setupId {}', [
      dao.toHexString(),
      plugin.toHexString(),
      setupId.toHexString(),
    ]);
    return;
  }
}

export function handleUninstallationApplied(
  event: UninstallationApplied
): void {
  let dao = event.params.dao;
  let plugin = event.params.plugin;

  // Check if the applied uninstallation is for our plugin.
  let installationId = getPluginInstallationId(dao, plugin);
  if (!installationId) {
    return;
  }

  let pluginEntity = Plugin.load(installationId.toHexString());
  if (!pluginEntity) {
    pluginEntity = new Plugin(installationId.toHexString());
    pluginEntity.dao = getDaoId(dao);
  }

  // Add plugin applied specific data
  updatePluginDataForUninstallationApplied(pluginEntity, event);

  pluginEntity.save();
}
