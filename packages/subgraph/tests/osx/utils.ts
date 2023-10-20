import {
  InstallationApplied,
  InstallationPrepared,
  InstallationPreparedPreparedSetupDataStruct,
} from '../../generated/PluginSetupProcessor/PluginSetupProcessor';
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
  let newEvent = changetype<InstallationPrepared>(newMockEvent());
  newEvent.parameters = [];

  let permissions: ethereum.Tuple[] = [];
  for (let i = 0; i < requestedPermissions.length; i++) {
    let permissionTuple = new ethereum.Tuple();
    for (let a = 0; a < requestedPermissions[i].length; a++) {
      permissionTuple.push(requestedPermissions[i][a]);
    }
    permissions.push(permissionTuple);
  }

  let helpersArray: Address[] = [];
  for (let i = 0; i < helpers.length; i++) {
    helpersArray.push(Address.fromString(helpers[i]));
  }

  let preparedSetupData = new InstallationPreparedPreparedSetupDataStruct();
  preparedSetupData.push(ethereum.Value.fromAddressArray(helpersArray));
  preparedSetupData.push(ethereum.Value.fromTupleArray(permissions));

  let senderParam = new ethereum.EventParam(
    'sender',
    ethereum.Value.fromAddress(Address.fromString(sender))
  );
  let daoParam = new ethereum.EventParam(
    'dao',
    ethereum.Value.fromAddress(Address.fromString(dao))
  );
  let preparedSetupIdParam = new ethereum.EventParam(
    'preparedSetupId',
    ethereum.Value.fromBytes(preparedSetupId)
  );
  let pluginSetupRepoParam = new ethereum.EventParam(
    'pluginSetupRepo',
    ethereum.Value.fromAddress(Address.fromString(pluginSetupRepo))
  );
  let versionTagParam = new ethereum.EventParam(
    'versionTag',
    ethereum.Value.fromTuple(versionTag)
  );
  let dataParam = new ethereum.EventParam(
    'data',
    ethereum.Value.fromBytes(data)
  );
  let pluginParam = new ethereum.EventParam(
    'plugin',
    ethereum.Value.fromAddress(Address.fromString(plugin))
  );
  let preparedSetupDataParam = new ethereum.EventParam(
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

export function createInstallationAppliedEvent(
  dao: string,
  plugin: string,
  preparedSetupId: Bytes,
  appliedSetupId: Bytes
): InstallationApplied {
  let newEvent = changetype<InstallationApplied>(newMockEvent);
  newEvent.parameters = [];

  let daoParam = new ethereum.EventParam(
    'dao',
    ethereum.Value.fromAddress(Address.fromString(dao))
  );
  let pluginParam = new ethereum.EventParam(
    'plugin',
    ethereum.Value.fromAddress(Address.fromString(plugin))
  );
  let preparedSetupIdParam = new ethereum.EventParam(
    'preparedSetupId',
    ethereum.Value.fromBytes(preparedSetupId)
  );
  let appliedSetupIdParam = new ethereum.EventParam(
    'appliedSetupId',
    ethereum.Value.fromBytes(appliedSetupId)
  );

  newEvent.parameters.push(daoParam);
  newEvent.parameters.push(pluginParam);
  newEvent.parameters.push(preparedSetupIdParam);
  newEvent.parameters.push(appliedSetupIdParam);
  return newEvent;
}
