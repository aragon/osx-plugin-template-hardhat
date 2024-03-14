import {InstallationPrepared} from '../../generated/PluginSetupProcessor/PluginSetupProcessor';
import {TokenVotingPlugin as TokenVotingPluginEntity} from '../../generated/schema';
import {TokenVoting} from '../../generated/templates';
import {TokenVoting as TokenVotingPluginContract} from '../../generated/templates/TokenVoting/TokenVoting';
import {PLUGIN_REPO_ADDRESS} from '../../imported/repo-address';
import {
  fetchOrCreateERC20Entity,
  fetchOrCreateWrappedERC20Entity,
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

  const daoAddress = event.params.dao;
  const pluginAddress = event.params.plugin;

  // Generate a unique ID for the plugin installation.
  const installationId = generatePluginInstallationEntityId(
    daoAddress,
    pluginAddress
  );
  // Log an error and exit if unable to generate the installation ID.
  if (!installationId) {
    log.error('Failed to generate installationId', [
      daoAddress.toHexString(),
      pluginAddress.toHexString(),
    ]);
    return;
  }
  createTokenVotingPlugin(pluginAddress, daoAddress);
}

function createTokenVotingPlugin(
  pluginAddress: Address,
  daoAddress: Address
): void {
  // pin this are we consistently generating this
  //   const pluginGenerationResult = generatePluginInstallationEntityId(
  //     daoAddress,
  //     pluginAddress
  //   );

  //   if (!pluginGenerationResult) {
  //     log.error('Failed to generate pluginId', [
  //       daoAddress.toHexString(),
  //       pluginAddress.toHexString(),
  //     ]);
  //     return;
  //   }

  //   const pluginId: string = pluginGenerationResult as string;

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
    context.setString('daoAddress', daoAddress.toHexString());
    TokenVoting.createWithContext(pluginAddress, context);

    pluginEntity.save();
  }
}
