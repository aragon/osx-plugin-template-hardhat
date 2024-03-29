import {DaoPlugin} from '../../generated/schema';
import {NumberStored} from '../../generated/templates/Plugin/Plugin';
import {generatePluginInstallationEntityId} from '@aragon/osx-commons-subgraph';
import {Address, dataSource} from '@graphprotocol/graph-ts';

export function handleNumberStored(event: NumberStored): void {
  const pluginAddress = event.address;

  const context = dataSource.context();
  const daoId = context.getString('daoAddress');

  const installationId = generatePluginInstallationEntityId(
    Address.fromString(daoId),
    pluginAddress
  );

  if (installationId) {
    const pluginEntity = DaoPlugin.load(installationId);
    if (pluginEntity) {
      pluginEntity.number = event.params.number;
      pluginEntity.save();
    }
  }
}
