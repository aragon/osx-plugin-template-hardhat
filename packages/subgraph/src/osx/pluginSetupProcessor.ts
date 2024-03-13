import {InstallationPrepared} from '../../generated/PluginSetupProcessor/PluginSetupProcessor';
import {TokenVotingPlugin} from '../../generated/schema';
import {TokenVoting} from '../../generated/templates';
import {TokenVoting as TokenVotingContract} from '../../generated/templates/TokenVoting/TokenVoting';
import {PLUGIN_REPO_ADDRESS} from '../../imported/repo-address';
import {
  fetchOrCreateERC20Entity,
  fetchOrCreateWrappedERC20Entity,
  supportsERC20Wrapped,
} from '../utils/tokens/erc20';
import {generatePluginInstallationEntityId} from '@aragon/osx-commons-subgraph';
import {
  Address,
  BigInt,
  Bytes,
  DataSourceContext,
  log,
} from '@graphprotocol/graph-ts';

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
  createTokenVotingPlugin(plugin, dao);
}

function createTokenVotingPlugin(plugin: Address, dao: Address): void {
  const pluginGenerationResult = generatePluginInstallationEntityId(
    dao,
    plugin
  );

  if (!pluginGenerationResult) {
    log.error('Failed to generate pluginId', [
      dao.toHexString(),
      plugin.toHexString(),
    ]);
    return;
  }

  const pluginId: string = pluginGenerationResult as string;

  let pluginEntity = TokenVotingPlugin.load(pluginId);

  if (!pluginEntity) {
    pluginEntity = new TokenVotingPlugin(pluginId);
    pluginEntity.pluginAddress = plugin;
    pluginEntity.daoAddress = Bytes.fromHexString(dao.toHexString());
    pluginEntity.proposalCount = BigInt.zero();

    const contract = TokenVotingContract.bind(plugin);
    const supportThreshold = contract.try_supportThreshold();
    const minParticipation = contract.try_minParticipation();
    const minDuration = contract.try_minDuration();
    const token = contract.try_getVotingToken();

    pluginEntity.supportThreshold = supportThreshold.reverted
      ? null
      : supportThreshold.value;
    pluginEntity.minParticipation = minParticipation.reverted
      ? null
      : minParticipation.value;
    pluginEntity.minDuration = minDuration.reverted ? null : minDuration.value;

    if (!token.reverted) {
      const tokenAddress = token.value;
      if (supportsERC20Wrapped(tokenAddress)) {
        const contract = fetchOrCreateWrappedERC20Entity(tokenAddress);
        if (!contract) {
          return;
        }

        pluginEntity.token = contract.id;
      } else {
        const contract = fetchOrCreateERC20Entity(tokenAddress);
        if (!contract) {
          return;
        }

        pluginEntity.token = contract.id;
      }
    }

    // Create template
    const context = new DataSourceContext();
    context.setString('daoAddress', dao.toHexString());
    TokenVoting.createWithContext(plugin, context);

    pluginEntity.save();
  }
}
