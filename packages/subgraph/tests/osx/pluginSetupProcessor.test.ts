import {getPluginInstallationId} from '../../commons/ids';
import {DaoPlugin} from '../../generated/schema';
import {
  handleInstallationApplied,
  handleInstallationPrepared,
  handleUninstallationApplied,
  handleUninstallationPrepared,
  handleUpdateApplied,
  handleUpdatePrepared,
} from '../../src/osx/pluginSetupProcessor';
import {PLUGIN_REPO_ADDRESS} from '../../utils/constants';
import {
  ADDRESS_FIVE,
  ADDRESS_FOUR,
  ADDRESS_SIX,
  ADDRESS_THREE,
  ADDRESS_TWO,
  ADDRESS_ZERO,
  APPLIED_PLUGIN_SETUP_ID,
  CONTRACT_ADDRESS,
  DAO_ADDRESS,
  PLUGIN_SETUP_ID,
} from '../utils/constants';
import {
  createInstallationAppliedEvent,
  createInstallationPreparedEvent,
  createUninstallationAppliedEvent,
  createUninstallationPreparedEvent,
  createUpdateAppliedEvent,
  createUpdatePreparedEvent,
} from './utils';
import {Address, BigInt, Bytes, ethereum} from '@graphprotocol/graph-ts';
import {assert, afterEach, clearStore, test, describe} from 'matchstick-as';

function assertPreparationStateUpdated(
  initialState: string,
  updateState: string
): void {
  const daoAddress = DAO_ADDRESS;
  const pluginAddress = Address.fromString(CONTRACT_ADDRESS);

  const setupId = PLUGIN_SETUP_ID;
  const installationId = getPluginInstallationId(
    Address.fromString(daoAddress),
    pluginAddress
  );
  if (!installationId) {
    throw new Error('Failed to get installationId');
  }
  const installationIdString = installationId.toHexString();

  // Create state
  let daoPlugin = new DaoPlugin(installationIdString);
  daoPlugin.dao = daoAddress;
  daoPlugin.pluginAddress = pluginAddress;
  daoPlugin.pluginInstallationId = installationId;
  daoPlugin.preparationState = initialState;
  daoPlugin.save();

  const versionTuple = new ethereum.Tuple();
  versionTuple.push(ethereum.Value.fromSignedBigInt(BigInt.fromString('1')));
  versionTuple.push(ethereum.Value.fromSignedBigInt(BigInt.fromString('2')));

  const permissions = [
    [
      ethereum.Value.fromSignedBigInt(BigInt.fromString('0')),
      ethereum.Value.fromAddress(Address.fromString(daoAddress)),
      ethereum.Value.fromAddress(pluginAddress),
      ethereum.Value.fromAddress(Address.fromString(ADDRESS_ZERO)),
      ethereum.Value.fromBytes(Bytes.fromHexString('0x1234')),
    ],

    [
      ethereum.Value.fromSignedBigInt(BigInt.fromString('2')),
      ethereum.Value.fromAddress(Address.fromString(daoAddress)),
      ethereum.Value.fromAddress(pluginAddress),
      ethereum.Value.fromAddress(Address.fromString(ADDRESS_SIX)),
      ethereum.Value.fromBytes(Bytes.fromHexString('0x5678')),
    ],
  ];

  if (initialState == 'InstallationPrepared' && updateState == 'Installed') {
    const event = createInstallationAppliedEvent(
      daoAddress,
      pluginAddress.toHexString(),
      Bytes.fromHexString(setupId),
      Bytes.fromHexString(APPLIED_PLUGIN_SETUP_ID)
    );
    handleInstallationApplied(event);
  } else if (initialState == 'Installed' && updateState == 'UpdatePrepared') {
    const event = createUpdatePreparedEvent(
      ADDRESS_THREE,
      daoAddress,
      pluginAddress.toHexString(),
      Bytes.fromHexString(setupId),
      PLUGIN_REPO_ADDRESS,
      versionTuple,
      [],
      [ADDRESS_FOUR, ADDRESS_FIVE],
      permissions,
      Bytes.fromHexString('0x00'),
      Bytes.fromHexString('0x12')
    );

    handleUpdatePrepared(event);
  } else if (initialState == 'UpdatePrepared' && updateState == 'Installed') {
    const event = createUpdateAppliedEvent(
      daoAddress,
      pluginAddress.toHexString(),
      Bytes.fromHexString(setupId),
      Bytes.fromHexString(APPLIED_PLUGIN_SETUP_ID)
    );
    handleUpdateApplied(event);
  } else if (
    initialState == 'Installed' &&
    updateState == 'UninstallationPrepared'
  ) {
    const event = createUninstallationPreparedEvent(
      ADDRESS_THREE,
      daoAddress,
      Bytes.fromHexString(setupId),
      PLUGIN_REPO_ADDRESS,
      versionTuple,
      pluginAddress.toHexString(),
      [ADDRESS_FOUR, ADDRESS_FIVE],
      Bytes.fromHexString('0x00'),
      permissions
    );
    handleUninstallationPrepared(event);
  } else if (
    initialState == 'UninstallationPrepared' &&
    updateState == 'Uninstalled'
  ) {
    const event = createUninstallationAppliedEvent(
      daoAddress,
      pluginAddress.toHexString(),
      setupId
    );
    handleUninstallationApplied(event);
  }

  assert.fieldEquals(
    'DaoPlugin',
    installationIdString,
    'id',
    installationIdString
  );
  assert.fieldEquals(
    'DaoPlugin',
    installationIdString,
    'preparationState',
    updateState
  );
  assert.entityCount('DaoPlugin', 1);
}

describe('OSx', () => {
  afterEach(() => {
    clearStore();
  });

  describe('Installation', () => {
    describe('InstallationPrepared event', () => {
      test('it should store one plugin', () => {
        // Create event
        const daoAddress = DAO_ADDRESS;
        const pluginAddress = CONTRACT_ADDRESS;
        const installationId = getPluginInstallationId(
          Address.fromString(daoAddress),
          Address.fromString(pluginAddress)
        );
        if (!installationId) {
          throw new Error('Failed to get installationId');
        }
        const setupId = PLUGIN_SETUP_ID;
        const versionTuple = new ethereum.Tuple();
        versionTuple.push(
          ethereum.Value.fromSignedBigInt(BigInt.fromString('1'))
        );
        versionTuple.push(
          ethereum.Value.fromSignedBigInt(BigInt.fromString('1'))
        );
        let permissions = [
          [
            ethereum.Value.fromSignedBigInt(BigInt.fromString('0')),
            ethereum.Value.fromAddress(Address.fromString(daoAddress)),
            ethereum.Value.fromAddress(Address.fromString(pluginAddress)),
            ethereum.Value.fromAddress(Address.fromString(ADDRESS_ZERO)),
            ethereum.Value.fromBytes(Bytes.fromHexString('0x1234')),
          ],

          [
            ethereum.Value.fromSignedBigInt(BigInt.fromString('2')),
            ethereum.Value.fromAddress(Address.fromString(daoAddress)),
            ethereum.Value.fromAddress(Address.fromString(pluginAddress)),
            ethereum.Value.fromAddress(Address.fromString(ADDRESS_SIX)),
            ethereum.Value.fromBytes(Bytes.fromHexString('0x5678')),
          ],
        ];

        let installationIdString = installationId.toHexString();

        const otherPluginSetupRepo = ADDRESS_TWO;

        const event1 = createInstallationPreparedEvent(
          ADDRESS_THREE, // sender
          daoAddress,
          pluginAddress,
          Bytes.fromHexString(setupId),
          otherPluginSetupRepo,
          versionTuple,
          Bytes.fromHexString('0x00'),
          [ADDRESS_FOUR, ADDRESS_FIVE],
          permissions
        );

        handleInstallationPrepared(event1);

        assert.notInStore('Dao', daoAddress);
        assert.notInStore('DaoPlugin', installationIdString);
        assert.entityCount('DaoPlugin', 0);

        const thisPluginRepoAddress = PLUGIN_REPO_ADDRESS;

        const event2 = createInstallationPreparedEvent(
          ADDRESS_THREE,
          daoAddress,
          pluginAddress,
          Bytes.fromHexString(setupId),
          thisPluginRepoAddress,
          versionTuple,
          Bytes.fromHexString('0x00'),
          [ADDRESS_FOUR, ADDRESS_FIVE],
          permissions
        );

        handleInstallationPrepared(event2);

        assert.fieldEquals('Dao', daoAddress, 'id', daoAddress);
        assert.fieldEquals(
          'DaoPlugin',
          installationIdString,
          'id',
          installationIdString
        );
        assert.entityCount('DaoPlugin', 1);
      });
    });

    describe('InstallationApplied event', () => {
      test('it should update preparationState', () => {
        assertPreparationStateUpdated('InstallationPrepared', 'Installed');
      });
    });
  });

  describe('Update', () => {
    describe('UpdatePrepared event', () => {
      test('it should update preparationState', () => {
        assertPreparationStateUpdated('Installed', 'UpdatePrepared');
      });
    });
    describe('UpdateApplied event', () => {
      test('it should update preparationState', () => {
        assertPreparationStateUpdated('UpdatePrepared', 'Installed');
      });
    });
  });

  describe('Uninstall', () => {
    describe('UninstallationPrepared event', () => {
      test('it should update preparationState', () => {
        assertPreparationStateUpdated('Installed', 'UpdatePrepared');
      });
    });
    describe('UninstallationApplied event', () => {
      test('it should update preparationState', () => {
        assertPreparationStateUpdated('UpdatePrepared', 'Installed');
      });
    });
  });
});
