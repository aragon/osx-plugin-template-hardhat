import {InstallationPrepared} from '../../generated/PluginSetupProcessor/PluginSetupProcessor';
import {DaoPlugin} from '../../generated/schema';
import {Plugin as PluginTemplate} from '../../generated/templates';
import {PLUGIN_REPO_ADDRESS} from '../../imported/repo-address';
import {generatePluginInstallationEntityId} from '@aragon/osx-commons-subgraph';
import {Address, DataSourceContext, log} from '@graphprotocol/graph-ts';

export function handleInstallationPrepared(event: InstallationPrepared): void {
  const pluginRepo = event.params.pluginSetupRepo;

  // Determine if the prepared plugin matches the plugin repository address.
  const isTargetPlugin = pluginRepo == Address.fromString(PLUGIN_REPO_ADDRESS);

  // Ignore other plugins.
  if (!isTargetPlugin) {
    return;
  }

  const dao = event.params.dao;
  const plugin = event.params.plugin;

  // Generate a unique ID for the plugin installation.
  const installationId = generatePluginInstallationEntityId(dao, plugin);
  // Log an error and exit if unable to generate the installation ID.
  if (!installationId) {
    log.error('Failed to generate installationId', [
      dao.toHexString(),
      plugin.toHexString(),
    ]);
    return;
  }
  // Load or create a new entry for the this plugin using the generated installation ID.
  let pluginEntity = DaoPlugin.load(installationId!);
  if (!pluginEntity) {
    pluginEntity = new DaoPlugin(installationId!);
  }

  // Set the DAO and plugin address for the plugin entity.
  pluginEntity.dao = dao;
  pluginEntity.pluginAddress = plugin;

  // Initialize a context for the plugin data source to enable indexing from the moment of preparation.
  const context = new DataSourceContext();
  // Include the DAO address in the context for future reference.
  context.setString('daoAddress', dao.toHexString());
  // Deploy a template for the plugin to facilitate individual contract indexing.
  PluginTemplate.createWithContext(plugin, context);

  pluginEntity.save();
}
