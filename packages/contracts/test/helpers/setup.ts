import {DAOMock, IPlugin, PluginSetupProcessor} from '../../typechain';
import {
  InstallationPreparedEvent,
  UninstallationPreparedEvent,
  UpdateAppliedEvent,
  UpdatePreparedEvent,
  PluginSetupRefStruct,
  UninstallationAppliedEvent,
  InstallationAppliedEvent,
} from '../../typechain/@aragon/osx/framework/plugin/setup/PluginSetupProcessor';
import {hashHelpers} from '../../utils/helpers';
import {
  findEvent,
  PLUGIN_SETUP_PROCESSOR_EVENTS,
} from '@aragon/osx-commons-sdk';
import {expect} from 'chai';
import {ContractTransaction} from 'ethers';

export async function installPLugin(
  psp: PluginSetupProcessor,
  dao: DAOMock,
  pluginSetupRef: PluginSetupRefStruct,
  data: string
): Promise<{
  prepareTx: ContractTransaction;
  applyTx: ContractTransaction;
  preparedEvent: InstallationPreparedEvent;
  appliedEvent: InstallationAppliedEvent;
}> {
  const prepareTx = await psp.prepareInstallation(dao.address, {
    pluginSetupRef: pluginSetupRef,
    data: data,
  });

  const preparedEvent = await findEvent<InstallationPreparedEvent>(
    prepareTx,
    PLUGIN_SETUP_PROCESSOR_EVENTS.InstallationPrepared
  );

  const plugin = preparedEvent.args.plugin;

  const applyTx = await psp.applyInstallation(dao.address, {
    pluginSetupRef: pluginSetupRef,
    plugin: plugin,
    permissions: preparedEvent.args.preparedSetupData.permissions,
    helpersHash: hashHelpers(preparedEvent.args.preparedSetupData.helpers),
  });

  const appliedEvent = await findEvent<InstallationAppliedEvent>(
    applyTx,
    PLUGIN_SETUP_PROCESSOR_EVENTS.InstallationApplied
  );

  return {prepareTx, applyTx, preparedEvent, appliedEvent};
}

export async function uninstallPLugin(
  psp: PluginSetupProcessor,
  dao: DAOMock,
  plugin: IPlugin,
  pluginSetupRef: PluginSetupRefStruct,
  data: string,
  currentHelpers: string[]
): Promise<{
  prepareTx: ContractTransaction;
  applyTx: ContractTransaction;
  preparedEvent: UninstallationPreparedEvent;
  appliedEvent: UninstallationAppliedEvent;
}> {
  const prepareTx = await psp.prepareUninstallation(dao.address, {
    pluginSetupRef: pluginSetupRef,
    setupPayload: {
      plugin: plugin.address,
      currentHelpers: currentHelpers,
      data: data,
    },
  });

  const preparedEvent = await findEvent<UninstallationPreparedEvent>(
    prepareTx,
    PLUGIN_SETUP_PROCESSOR_EVENTS.UninstallationPrepared
  );

  const preparedPermissions = preparedEvent.args.permissions;

  const applyTx = await psp.applyUninstallation(dao.address, {
    plugin: plugin.address,
    pluginSetupRef: pluginSetupRef,
    permissions: preparedPermissions,
  });

  const appliedEvent = await findEvent<UninstallationAppliedEvent>(
    applyTx,
    PLUGIN_SETUP_PROCESSOR_EVENTS.UninstallationApplied
  );

  return {prepareTx, applyTx, preparedEvent, appliedEvent};
}

export async function updatePlugin(
  psp: PluginSetupProcessor,
  dao: DAOMock,
  plugin: IPlugin,
  currentHelpers: string[],
  pluginSetupRefCurrent: PluginSetupRefStruct,
  pluginSetupRefUpdate: PluginSetupRefStruct,
  data: string
): Promise<{
  prepareTx: ContractTransaction;
  applyTx: ContractTransaction;
  preparedEvent: UpdatePreparedEvent;
  appliedEvent: UpdateAppliedEvent;
}> {
  expect(pluginSetupRefCurrent.pluginSetupRepo).to.equal(
    pluginSetupRefUpdate.pluginSetupRepo
  );

  const prepareTx = await psp.prepareUpdate(dao.address, {
    currentVersionTag: pluginSetupRefCurrent.versionTag,
    newVersionTag: pluginSetupRefUpdate.versionTag,
    pluginSetupRepo: pluginSetupRefUpdate.pluginSetupRepo,
    setupPayload: {
      plugin: plugin.address,
      currentHelpers: currentHelpers,
      data: data,
    },
  });
  const preparedEvent = await findEvent<UpdatePreparedEvent>(
    prepareTx,
    PLUGIN_SETUP_PROCESSOR_EVENTS.UpdatePrepared
  );

  const applyTx = await psp.applyUpdate(dao.address, {
    plugin: plugin.address,
    pluginSetupRef: pluginSetupRefUpdate,
    initData: preparedEvent.args.initData,
    permissions: preparedEvent.args.preparedSetupData.permissions,
    helpersHash: hashHelpers(preparedEvent.args.preparedSetupData.helpers),
  });
  const appliedEvent = await findEvent<UpdateAppliedEvent>(
    applyTx,
    PLUGIN_SETUP_PROCESSOR_EVENTS.UpdateApplied
  );

  return {prepareTx, applyTx, preparedEvent, appliedEvent};
}
