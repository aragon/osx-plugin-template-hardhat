import {getPluginInstallationId} from '../../commons/ids';
import {Plugin} from '../../generated/schema';
import {Initialized} from '../../generated/templates/Plugin/Plugin';
import {Address, dataSource} from '@graphprotocol/graph-ts';

export function handleInitialized(event: Initialized): void {
  const pluginAddress = event.address;

  const context = dataSource.context();
  const daoId = context.getString('daoAddress');

  const installationId = getPluginInstallationId(
    Address.fromString(daoId),
    pluginAddress
  );

  if (installationId) {
    const pluginEntity = Plugin.load(installationId.toHexString());
    if (pluginEntity) {
      const initCount = event.params.version;
      pluginEntity.initializedCount = initCount;

      pluginEntity.save();
    }
  }
}
