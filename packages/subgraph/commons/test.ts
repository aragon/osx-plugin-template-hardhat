// TODO: Remove this file and import from OSx-commons-subgraph,
// once the OSx-commons-subgraph npm package is published
import {
  InstallationPrepared,
  InstallationPreparedPreparedSetupDataStruct,
} from '../generated/PluginSetupProcessor/PluginSetupProcessor';
import {Address, Bytes, ethereum} from '@graphprotocol/graph-ts';
import {newMockEvent} from 'matchstick-as';

export function createInstallationPreparedEvent(
  sender: string,
  dao: string,
  plugin: string,
  preparedSetupId: Bytes,
  pluginSetupRepo: string,
  versionTag: ethereum.Tuple,
  data: Bytes,
  helpers: string[],
  requestedPermissions: ethereum.Value[][]
): InstallationPrepared {
  const newEvent = changetype<InstallationPrepared>(newMockEvent());
  newEvent.parameters = [];

  const permissions: ethereum.Tuple[] = [];
  for (let i = 0; i < requestedPermissions.length; i++) {
    const permissionTuple = new ethereum.Tuple();
    for (let a = 0; a < requestedPermissions[i].length; a++) {
      permissionTuple.push(requestedPermissions[i][a]);
    }
    permissions.push(permissionTuple);
  }

  const helpersArray: Address[] = [];
  for (let i = 0; i < helpers.length; i++) {
    helpersArray.push(Address.fromString(helpers[i]));
  }

  const preparedSetupData = new InstallationPreparedPreparedSetupDataStruct();
  preparedSetupData.push(ethereum.Value.fromAddressArray(helpersArray));
  preparedSetupData.push(ethereum.Value.fromTupleArray(permissions));

  const senderParam = new ethereum.EventParam(
    'sender',
    ethereum.Value.fromAddress(Address.fromString(sender))
  );
  const daoParam = new ethereum.EventParam(
    'dao',
    ethereum.Value.fromAddress(Address.fromString(dao))
  );
  const preparedSetupIdParam = new ethereum.EventParam(
    'preparedSetupId',
    ethereum.Value.fromBytes(preparedSetupId)
  );
  const pluginSetupRepoParam = new ethereum.EventParam(
    'pluginSetupRepo',
    ethereum.Value.fromAddress(Address.fromString(pluginSetupRepo))
  );
  const versionTagParam = new ethereum.EventParam(
    'versionTag',
    ethereum.Value.fromTuple(versionTag)
  );
  const dataParam = new ethereum.EventParam(
    'data',
    ethereum.Value.fromBytes(data)
  );
  const pluginParam = new ethereum.EventParam(
    'plugin',
    ethereum.Value.fromAddress(Address.fromString(plugin))
  );
  const preparedSetupDataParam = new ethereum.EventParam(
    'preparedSetupData',
    ethereum.Value.fromTuple(preparedSetupData)
  );

  newEvent.parameters.push(senderParam);
  newEvent.parameters.push(daoParam);
  newEvent.parameters.push(preparedSetupIdParam);
  newEvent.parameters.push(pluginSetupRepoParam);
  newEvent.parameters.push(versionTagParam);
  newEvent.parameters.push(dataParam);
  newEvent.parameters.push(pluginParam);
  newEvent.parameters.push(preparedSetupDataParam);
  return newEvent;
}
