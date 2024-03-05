import {DAOMock, IPlugin} from '../../typechain';
import {hashHelpers} from '../../utils/helpers';
import {findEvent} from '@aragon/osx-commons-sdk';
import {
  PluginSetupProcessorEvents,
  PluginSetupProcessorStructs,
  PluginSetupProcessor,
} from '@aragon/osx-ethers';
import {expect} from 'chai';
import {ContractTransaction} from 'ethers';

export async function installPLugin(
  psp: PluginSetupProcessor,
  dao: DAOMock,
  pluginSetupRef: PluginSetupProcessorStructs.PluginSetupRefStruct,
  data: string
): Promise<{
  prepareTx: ContractTransaction;
  applyTx: ContractTransaction;
  preparedEvent: PluginSetupProcessorEvents.InstallationPreparedEvent;
  appliedEvent: PluginSetupProcessorEvents.InstallationAppliedEvent;
}> {
  const prepareTx = await psp.prepareInstallation(dao.address, {
    pluginSetupRef: pluginSetupRef,
    data: data,
  });

  const preparedEvent =
    await findEvent<PluginSetupProcessorEvents.InstallationPreparedEvent>(
      prepareTx,
      psp.interface.getEvent('InstallationPrepared').name
    );

  const plugin = preparedEvent.args.plugin;

  const applyTx = await psp.applyInstallation(dao.address, {
    pluginSetupRef: pluginSetupRef,
    plugin: plugin,
    permissions: preparedEvent.args.preparedSetupData.permissions,
    helpersHash: hashHelpers(preparedEvent.args.preparedSetupData.helpers),
  });

  const appliedEvent =
    await findEvent<PluginSetupProcessorEvents.InstallationAppliedEvent>(
      applyTx,
      psp.interface.getEvent('InstallationApplied').name
    );

  return {prepareTx, applyTx, preparedEvent, appliedEvent};
}

export async function uninstallPLugin(
  psp: PluginSetupProcessor,
  dao: DAOMock,
  plugin: IPlugin,
  pluginSetupRef: PluginSetupProcessorStructs.PluginSetupRefStruct,
  data: string,
  currentHelpers: string[]
): Promise<{
  prepareTx: ContractTransaction;
  applyTx: ContractTransaction;
  preparedEvent: PluginSetupProcessorEvents.UninstallationPreparedEvent;
  appliedEvent: PluginSetupProcessorEvents.UninstallationAppliedEvent;
}> {
  const prepareTx = await psp.prepareUninstallation(dao.address, {
    pluginSetupRef: pluginSetupRef,
    setupPayload: {
      plugin: plugin.address,
      currentHelpers: currentHelpers,
      data: data,
    },
  });

  const preparedEvent =
    await findEvent<PluginSetupProcessorEvents.UninstallationPreparedEvent>(
      prepareTx,
      psp.interface.getEvent('UninstallationPrepared').name
    );

  const preparedPermissions = preparedEvent.args.permissions;

  const applyTx = await psp.applyUninstallation(dao.address, {
    plugin: plugin.address,
    pluginSetupRef: pluginSetupRef,
    permissions: preparedPermissions,
  });

  const appliedEvent =
    await findEvent<PluginSetupProcessorEvents.UninstallationAppliedEvent>(
      applyTx,
      psp.interface.getEvent('UninstallationApplied').name
    );

  return {prepareTx, applyTx, preparedEvent, appliedEvent};
}

export async function updatePlugin(
  psp: PluginSetupProcessor,
  dao: DAOMock,
  plugin: IPlugin,
  currentHelpers: string[],
  pluginSetupRefCurrent: PluginSetupProcessorStructs.PluginSetupRefStruct,
  pluginSetupRefUpdate: PluginSetupProcessorStructs.PluginSetupRefStruct,
  data: string
): Promise<{
  prepareTx: ContractTransaction;
  applyTx: ContractTransaction;
  preparedEvent: PluginSetupProcessorEvents.UpdatePreparedEvent;
  appliedEvent: PluginSetupProcessorEvents.UpdateAppliedEvent;
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
  const preparedEvent =
    await findEvent<PluginSetupProcessorEvents.UpdatePreparedEvent>(
      prepareTx,
      psp.interface.getEvent('UpdatePrepared').name
    );

  const applyTx = await psp.applyUpdate(dao.address, {
    plugin: plugin.address,
    pluginSetupRef: pluginSetupRefUpdate,
    initData: preparedEvent.args.initData,
    permissions: preparedEvent.args.preparedSetupData.permissions,
    helpersHash: hashHelpers(preparedEvent.args.preparedSetupData.helpers),
  });
  const appliedEvent =
    await findEvent<PluginSetupProcessorEvents.UpdateAppliedEvent>(
      applyTx,
      psp.interface.getEvent('UpdateApplied').name
    );

  return {prepareTx, applyTx, preparedEvent, appliedEvent};
}
