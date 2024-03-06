import {METADATA, VERSION} from '../../plugin-settings';
import {
  IPlugin,
  PluginUpgradeableSetup__factory,
  ProxyFactory__factory,
} from '../../typechain';
import {ProxyCreatedEvent} from '../../typechain/@aragon/osx-commons-contracts/src/utils/deployment/ProxyFactory';
import {PluginUUPSUpgradeable__factory} from '../../typechain/factories/@aragon/osx-v1.0.0/core/plugin';
import {hashHelpers} from '../../utils/helpers';
import {
  DAO_PERMISSIONS,
  PLUGIN_SETUP_PROCESSOR_PERMISSIONS,
  PLUGIN_UUPS_UPGRADEABLE_PERMISSIONS,
  findEvent,
  getNamedTypesFromMetadata,
} from '@aragon/osx-commons-sdk';
import {
  PluginSetupProcessorEvents,
  PluginSetupProcessorStructs,
  PluginSetupProcessor,
  DAOStructs,
  DAO,
  DAO__factory,
  PluginRepo,
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

export async function updateFromBuildTest(
  dao: DAO,
  deployer: SignerWithAddress,
  psp: PluginSetupProcessor,
  pluginRepo: PluginRepo,
  pluginSetupRefLatestBuild: PluginSetupProcessorStructs.PluginSetupRefStruct,
  build: number,
  installationInputs: any[],
  updateInputs: any[]
) {
  // Grant deployer all required permissions
  await dao
    .connect(deployer)
    .grant(
      psp.address,
      deployer.address,
      PLUGIN_SETUP_PROCESSOR_PERMISSIONS.APPLY_INSTALLATION_PERMISSION_ID
    );
  await dao
    .connect(deployer)
    .grant(
      psp.address,
      deployer.address,
      PLUGIN_SETUP_PROCESSOR_PERMISSIONS.APPLY_UPDATE_PERMISSION_ID
    );

  await dao
    .connect(deployer)
    .grant(dao.address, psp.address, DAO_PERMISSIONS.ROOT_PERMISSION_ID);

  // Install build 1.
  const pluginSetupRefBuild1 = {
    versionTag: {
      release: VERSION.release,
      build: build,
    },
    pluginSetupRepo: pluginRepo.address,
  };
  const installationResults = await installPLugin(
    deployer,
    psp,
    dao,
    pluginSetupRefBuild1,
    ethers.utils.defaultAbiCoder.encode(
      getNamedTypesFromMetadata(
        METADATA.build.pluginSetup.prepareInstallation.inputs
      ),
      installationInputs
    )
  );

  // Get the plugin address.
  const plugin = PluginUUPSUpgradeable__factory.connect(
    installationResults.preparedEvent.args.plugin,
    deployer
  );

  // Check that the implementation of the plugin proxy matches the latest build
  const implementationBuild1 = await PluginUpgradeableSetup__factory.connect(
    (
      await pluginRepo['getVersion((uint8,uint16))'](
        pluginSetupRefBuild1.versionTag
      )
    ).pluginSetup,
    deployer
  ).implementation();
  expect(await plugin.implementation()).to.equal(implementationBuild1);

  // Grant the PSP the permission to upgrade the plugin implementation.
  await dao
    .connect(deployer)
    .grant(
      plugin.address,
      psp.address,
      PLUGIN_UUPS_UPGRADEABLE_PERMISSIONS.UPGRADE_PLUGIN_PERMISSION_ID
    );

  // Update build 1 to the latest build
  await expect(
    updatePlugin(
      deployer,
      psp,
      dao,
      plugin,
      installationResults.preparedEvent.args.preparedSetupData.helpers,
      pluginSetupRefBuild1,
      pluginSetupRefLatestBuild,
      ethers.utils.defaultAbiCoder.encode(
        getNamedTypesFromMetadata(
          METADATA.build.pluginSetup.prepareUpdate[1].inputs
        ),
        updateInputs
      )
    )
  ).to.not.be.reverted;

  // Check that the implementation of the plugin proxy matches the latest build
  const implementationLatestBuild =
    await PluginUpgradeableSetup__factory.connect(
      (
        await pluginRepo['getVersion((uint8,uint16))'](
          pluginSetupRefLatestBuild.versionTag
        )
      ).pluginSetup,
      deployer
    ).implementation();
  expect(await plugin.implementation()).to.equal(implementationLatestBuild);
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
