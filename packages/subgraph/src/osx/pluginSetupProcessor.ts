import {InstallationPrepared} from '../../generated/PluginSetupProcessor/PluginSetupProcessor';
import {MultisigPlugin} from '../../generated/schema';
import {Plugin as PluginTemplate} from '../../generated/templates';
import {PLUGIN_REPO_ADDRESS} from '../../imported/repo-address';
import {generatePluginEntityId} from '@aragon/osx-commons-subgraph';
import {Address, BigInt, DataSourceContext} from '@graphprotocol/graph-ts';

export function handleInstallationPrepared(event: InstallationPrepared): void {
  const pluginRepo = event.params.pluginSetupRepo;

  // Determine if the prepared plugin matches the plugin repository address.
  const isTargetPlugin = pluginRepo == Address.fromString(PLUGIN_REPO_ADDRESS);

  // Ignore other plugins.
  if (!isTargetPlugin) {
    return;
  }

  const daoAddress = event.params.dao;
  const pluginAddress = event.params.plugin;
  const pluginId = generatePluginEntityId(pluginAddress);

  // Load or create a new entry for the this plugin using the generated installation ID.
  let pluginEntity = MultisigPlugin.load(pluginId);
  if (!pluginEntity) {
    pluginEntity = new MultisigPlugin(pluginId);
  }

  // Set the DAO and plugin address for the plugin entity.
  pluginEntity.daoAddress = daoAddress;
  pluginEntity.pluginAddress = pluginAddress;
  pluginEntity.proposalCount = BigInt.zero();

  // Initialize a context for the plugin data source to enable indexing from the moment of preparation.
  const context = new DataSourceContext();
  // Include the DAO address in the context for future reference.
  context.setString('daoAddress', daoAddress.toHexString());
  // Deploy a template for the plugin to facilitate individual contract indexing.
  PluginTemplate.createWithContext(pluginAddress, context);

  pluginEntity.save();
}
