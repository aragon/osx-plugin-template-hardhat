import {getPluginVersionId, getPluginInstallationId} from '../../commons/ids';
import {InstallationPrepared} from '../../generated/PluginSetupProcessor/PluginSetupProcessor';
import {
  Plugin,
  PluginPermission,
  PluginPreparation,
} from '../../generated/schema';
import {Plugin as PluginTemplate} from '../../generated/templates';
import {
  Address,
  Bytes,
  DataSourceContext,
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

export function createPluginPreparation(event: InstallationPrepared): void {
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
  preparationEntity.pluginRepo = event.params.pluginSetupRepo.toHexString();
  preparationEntity.pluginVersion = pluginVersionId;
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
}

export function createPlugin(daoId: string, plugin: Address): void {
  let installationId = getPluginInstallationId(daoId, plugin.toHexString());
  if (!installationId) {
    log.error('Failed to get installationId', [daoId, plugin.toHexString()]);
    return;
  }

  let pluginEntity = Plugin.load(installationId.toHexString());
  if (!pluginEntity) {
    pluginEntity = new Plugin(installationId.toHexString());
  }
  pluginEntity.dao = daoId;
  pluginEntity.pluginAddress = plugin;
  pluginEntity.state = 'InstallationPrepared';

  addPluginSpecificData(pluginEntity);

  // Create template
  let context = new DataSourceContext();
  context.setString('daoAddress', daoId);
  PluginTemplate.createWithContext(plugin, context);

  pluginEntity.save();
}
