import {ERC165 as ERC165Contract} from '../../generated/PluginSetupProcessor/ERC165';
import {InstallationPrepared} from '../../generated/PluginSetupProcessor/PluginSetupProcessor';
import {
  Plugin,
  PluginPermission,
  PluginPreparation,
} from '../../generated/schema';
import {Plugin as PluginTemplate} from '../../generated/templates';
import {PLUGIN_INTERFACE} from '../utils/constants';
import {supportsInterface} from '../utils/erc165';
import {
  Address,
  Bytes,
  DataSourceContext,
  ethereum,
  crypto,
  ByteArray,
  BigInt,
  log,
} from '@graphprotocol/graph-ts';

export const PERMISSION_OPERATIONS = new Map<number, string>()
  .set(0, 'Grant')
  .set(1, 'Revoke')
  .set(2, 'GrantWithCondition');

function addPluginSpecificData(pluginEntity: Plugin) {
  pluginEntity.onlyListed = false;
  pluginEntity.proposalCount = BigInt.zero();
}

export function addPlugin(event: InstallationPrepared): void {
  let dao = event.params.dao.toHexString();
  let plugin = event.params.plugin;
  let contract = ERC165Contract.bind(plugin);

  let pluginInterfaceSupported = supportsInterface(contract, PLUGIN_INTERFACE);

  if (pluginInterfaceSupported) {
    createPlugin(event);
  }
}

function createPlugin(event: InstallationPrepared): void {
  let dao = event.params.dao.toHexString();
  let plugin = event.params.plugin;
  let setupId = event.params.preparedSetupId.toHexString();
  let pluginRepo = event.params.pluginSetupRepo.toHexString();
  let pluginVersionId = getPluginVersionId(
    pluginRepo,
    event.params.versionTag.release,
    event.params.versionTag.build
  );

  let installationId = getPluginInstallationId(dao, plugin.toHexString());
  if (!installationId) {
    log.error('Failed to get installationId', [dao, plugin.toHexString()]);
    return;
  }

  let preparationId = `${installationId.toHexString()}_${setupId}`;

  let helpers: Bytes[] = [];
  for (let i = 0; i < event.params.preparedSetupData.helpers.length; i++) {
    helpers.push(event.params.preparedSetupData.helpers[i]);
  }

  let preparationEntity = new PluginPreparation(preparationId);
  preparationEntity.installation = installationId.toHexString();
  preparationEntity.creator = event.params.sender;
  preparationEntity.dao = dao;
  preparationEntity.preparedSetupId = event.params.preparedSetupId;
  preparationEntity.pluginRepo = event.params.pluginSetupRepo.toHexString();
  preparationEntity.pluginVersion = pluginVersionId;
  preparationEntity.data = event.params.data;
  preparationEntity.pluginAddress = event.params.plugin;
  preparationEntity.helpers = helpers;
  preparationEntity.type = 'Installation';
  preparationEntity.save();

  for (let i = 0; i < event.params.preparedSetupData.permissions.length; i++) {
    let permission = event.params.preparedSetupData.permissions[i];
    let operation = PERMISSION_OPERATIONS.get(permission.operation);
    let permissionId = `${preparationId}_${operation}_${permission.where.toHexString()}_${permission.who.toHexString()}_${permission.permissionId.toHexString()}`;
    let permissionEntity = new PluginPermission(permissionId);
    permissionEntity.pluginPreparation = preparationId;
    permissionEntity.operation = operation;
    permissionEntity.where = permission.where;
    permissionEntity.who = permission.who;
    permissionEntity.permissionId = permission.permissionId;
    if (permission.condition) {
      permissionEntity.condition = permission.condition;
    }
    permissionEntity.save();
  }

  let pluginEntity = Plugin.load(installationId.toHexString());
  if (!pluginEntity) {
    pluginEntity = new Plugin(installationId.toHexString());
  }
  pluginEntity.dao = dao;
  pluginEntity.pluginAddress = plugin;
  pluginEntity.state = 'InstallationPrepared';

  addPluginSpecificData(pluginEntity);

  // Create template
  let context = new DataSourceContext();
  context.setString('daoAddress', dao);
  PluginTemplate.createWithContext(plugin, context);

  pluginEntity.save();
}

export function getPluginInstallationId(
  dao: string,
  plugin: string
): Bytes | null {
  let installationIdTupleArray = new ethereum.Tuple();
  installationIdTupleArray.push(
    ethereum.Value.fromAddress(Address.fromString(dao))
  );
  installationIdTupleArray.push(
    ethereum.Value.fromAddress(Address.fromString(plugin))
  );

  let installationIdTuple = installationIdTupleArray as ethereum.Tuple;
  let installationIdTupleEncoded = ethereum.encode(
    ethereum.Value.fromTuple(installationIdTuple)
  );

  if (installationIdTupleEncoded) {
    return Bytes.fromHexString(
      crypto
        .keccak256(
          ByteArray.fromHexString(installationIdTupleEncoded.toHexString())
        )
        .toHexString()
    );
  }
  return null;
}

export function getPluginVersionId(
  pluginRepo: string,
  release: i32,
  build: i32
): string {
  return pluginRepo
    .concat('_')
    .concat(release.toString())
    .concat('_')
    .concat(build.toString());
}
