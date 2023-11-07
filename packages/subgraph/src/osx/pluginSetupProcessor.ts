import {getPluginInstallationId} from '../../commons/ids';
import {InstallationPrepared} from '../../generated/PluginSetupProcessor/PluginSetupProcessor';
import {DaoPlugin} from '../../generated/schema';
import {Plugin as PluginTemplate} from '../../generated/templates';
import {PLUGIN_REPO_ADDRESS} from '../../utils/constants';
import {Address, DataSourceContext, log} from '@graphprotocol/graph-ts';

export function handleInstallationPrepared(event: InstallationPrepared): void {
  const pluginRepo = event.params.pluginSetupRepo;

  // Check if the prepared plugin is our plugin.
  const isThisPlugin = pluginRepo == Address.fromString(PLUGIN_REPO_ADDRESS);

  if (!isThisPlugin) {
    return;
  }

  const dao = event.params.dao;
  const plugin = event.params.plugin;

  const installationId = getPluginInstallationId(dao, plugin);
  if (!installationId) {
    log.error('Failed to get installationId', [
      dao.toHexString(),
      plugin.toHexString(),
    ]);
    return;
  }

  ////////////////////////////////////////////////////////////
  // Index plugin
  ////////////////////////////////////////////////////////////
  let pluginEntity = DaoPlugin.load(installationId.toHexString());
  if (!pluginEntity) {
    pluginEntity = new DaoPlugin(installationId.toHexString());
  }
  pluginEntity.dao = dao;
  pluginEntity.pluginAddress = plugin;

  // Create plugin template, So subgaph this subgraph can index individual plugin contract from the initial moment (ie. when it is prepared)
  const context = new DataSourceContext();
  // add dao address to the context, so `PluginInstallationId` can be reconstructed
  context.setString('daoAddress', dao.toHexString());
  PluginTemplate.createWithContext(plugin, context);

  pluginEntity.save();
}
