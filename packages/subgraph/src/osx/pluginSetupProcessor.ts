import {InstallationPrepared} from '../../generated/PluginSetupProcessor/PluginSetupProcessor';
import {TokenVotingPlugin as TokenVotingPluginEntity} from '../../generated/schema';
import {TokenVoting} from '../../generated/templates';
import {TokenVoting as TokenVotingPluginContract} from '../../generated/templates/TokenVoting/TokenVoting';
import {PLUGIN_REPO_ADDRESS} from '../../imported/repo-address';
import {
  fetchOrCreateERC20Entity,
  fetchOrCreateWrappedERC20Entity,
  identifyAndFetchOrCreateERC20TokenEntity,
  supportsERC20Wrapped,
} from '../utils/tokens/erc20';
import {
  generatePluginEntityId,
  generatePluginInstallationEntityId,
} from '@aragon/osx-commons-subgraph';
import {
  Address,
  BigInt,
  Bytes,
  DataSourceContext,
} from '@graphprotocol/graph-ts';

export function handleInstallationPrepared(event: InstallationPrepared): void {
  const pluginRepo = event.params.pluginSetupRepo;

  // Determine if the prepared plugin matches the plugin repository address.
  const isTargetPlugin = pluginRepo == Address.fromString(PLUGIN_REPO_ADDRESS);

  // Ignore other plugins.
  if (!isTargetPlugin) {
    return;
  }

  createTokenVotingPlugin(event.params.plugin, event.params.dao);
}

function createTokenVotingPlugin(
  pluginAddress: Address,
  daoAddress: Address
): void {
  const pluginId = generatePluginEntityId(pluginAddress);
  let pluginEntity = TokenVotingPluginEntity.load(pluginId);

  if (!pluginEntity) {
    pluginEntity = new TokenVotingPluginEntity(pluginId);
    pluginEntity.pluginAddress = pluginAddress;
    pluginEntity.daoAddress = Bytes.fromHexString(daoAddress.toHexString());
    pluginEntity.proposalCount = BigInt.zero();

    const contract = TokenVotingPluginContract.bind(pluginAddress);
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
      const contract = identifyAndFetchOrCreateERC20TokenEntity(token.value);
      if (!contract) {
        return;
      }
      pluginEntity.token = contract;
    }

    // Create template
    const context = new DataSourceContext();
    context.setString('daoAddress', daoAddress.toHexString());
    TokenVoting.createWithContext(pluginAddress, context);
    pluginEntity.save();
  }
}
