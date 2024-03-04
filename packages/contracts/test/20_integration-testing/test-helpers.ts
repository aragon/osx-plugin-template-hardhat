import {IPlugin, ProxyFactory__factory} from '../../typechain';
import {ProxyCreatedEvent} from '../../typechain/@aragon/osx-commons-contracts/src/utils/deployment/ProxyFactory';
import {hashHelpers} from '../../utils/helpers';
import {
  DAO_PERMISSIONS,
  PLUGIN_SETUP_PROCESSOR_PERMISSIONS,
  findEvent,
} from '@aragon/osx-commons-sdk';
import {
  PluginSetupProcessorEvents,
  PluginSetupProcessorStructs,
  PluginSetupProcessor,
  DAOStructs,
  DAO,
  DAO__factory,
} from '@aragon/osx-ethers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {ContractTransaction} from 'ethers';
import {ethers} from 'hardhat';

export async function installPLugin(
  signer: SignerWithAddress,
  psp: PluginSetupProcessor,
  dao: DAO,
  pluginSetupRef: PluginSetupProcessorStructs.PluginSetupRefStruct,
  data: string
): Promise<{
  prepareTx: ContractTransaction;
  applyTx: ContractTransaction;
  preparedEvent: PluginSetupProcessorEvents.InstallationPreparedEvent;
  appliedEvent: PluginSetupProcessorEvents.InstallationAppliedEvent;
}> {
  const prepareTx = await psp.connect(signer).prepareInstallation(dao.address, {
    pluginSetupRef: pluginSetupRef,
    data: data,
  });

  const preparedEvent =
    await findEvent<PluginSetupProcessorEvents.InstallationPreparedEvent>(
      prepareTx,
      psp.interface.getEvent('InstallationPrepared').name
    );

  const plugin = preparedEvent.args.plugin;
  const preparedPermissions = preparedEvent.args.preparedSetupData.permissions;

  await checkPermissions(
    preparedPermissions,
    dao,
    psp,
    signer,
    PLUGIN_SETUP_PROCESSOR_PERMISSIONS.APPLY_INSTALLATION_PERMISSION_ID
  );

  const applyTx = await psp.connect(signer).applyInstallation(dao.address, {
    pluginSetupRef: pluginSetupRef,
    plugin: plugin,
    permissions: preparedPermissions,
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
  signer: SignerWithAddress,
  psp: PluginSetupProcessor,
  dao: DAO,
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
  const prepareTx = await psp
    .connect(signer)
    .prepareUninstallation(dao.address, {
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

  await checkPermissions(
    preparedPermissions,
    dao,
    psp,
    signer,
    PLUGIN_SETUP_PROCESSOR_PERMISSIONS.APPLY_UNINSTALLATION_PERMISSION_ID
  );

  const applyTx = await psp.connect(signer).applyUninstallation(dao.address, {
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
  signer: SignerWithAddress,
  psp: PluginSetupProcessor,
  dao: DAO,
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

  const prepareTx = await psp.connect(signer).prepareUpdate(dao.address, {
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

  const preparedPermissions = preparedEvent.args.preparedSetupData.permissions;

  await checkPermissions(
    preparedPermissions,
    dao,
    psp,
    signer,
    PLUGIN_SETUP_PROCESSOR_PERMISSIONS.APPLY_UPDATE_PERMISSION_ID
  );

  const applyTx = await psp.connect(signer).applyUpdate(dao.address, {
    plugin: plugin.address,
    pluginSetupRef: pluginSetupRefUpdate,
    initData: preparedEvent.args.initData,
    permissions: preparedPermissions,
    helpersHash: hashHelpers(preparedEvent.args.preparedSetupData.helpers),
  });
  const appliedEvent =
    await findEvent<PluginSetupProcessorEvents.UpdateAppliedEvent>(
      applyTx,
      psp.interface.getEvent('UpdateApplied').name
    );

  return {prepareTx, applyTx, preparedEvent, appliedEvent};
}

async function checkPermissions(
  preparedPermissions: DAOStructs.MultiTargetPermissionStruct[],
  dao: DAO,
  psp: PluginSetupProcessor,
  signer: SignerWithAddress,
  applyPermissionId: string
) {
  if (preparedPermissions.length !== 0) {
    if (
      !(await dao.hasPermission(
        dao.address,
        psp.address,
        DAO_PERMISSIONS.ROOT_PERMISSION_ID,
        []
      ))
    ) {
      throw `The 'PluginSetupProcessor' does not have 'ROOT_PERMISSION_ID' on the DAO and thus cannot process the list of permissions requested by the plugin setup.`;
    }
  }
  if (
    signer.address !== dao.address &&
    !(await dao.hasPermission(
      psp.address,
      signer.address,
      applyPermissionId,
      []
    ))
  ) {
    throw `The used signer does not have the permission with ID '${applyPermissionId}' granted and thus cannot apply the setup`;
  }
}

// TODO Move into OSX commons as part of Task OS-928.
export async function createDaoProxy(
  deployer: SignerWithAddress,
  dummyMetadata: string
): Promise<DAO> {
  const daoImplementation = await new DAO__factory(deployer).deploy();
  const daoProxyFactory = await new ProxyFactory__factory(deployer).deploy(
    daoImplementation.address
  );

  const daoInitData = daoImplementation.interface.encodeFunctionData(
    'initialize',
    [
      dummyMetadata,
      deployer.address,
      ethers.constants.AddressZero,
      dummyMetadata,
    ]
  );
  const tx = await daoProxyFactory.deployUUPSProxy(daoInitData);
  const event = await findEvent<ProxyCreatedEvent>(
    tx,
    daoProxyFactory.interface.getEvent('ProxyCreated').name
  );
  const dao = DAO__factory.connect(event.args.proxy, deployer);
  return dao;
}
