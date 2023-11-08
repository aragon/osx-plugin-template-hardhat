import {generatePluginInstallationEntityId} from '../../commons/ids';
import {createInstallationPreparedEvent} from '../../commons/test';
import {handleInstallationPrepared} from '../../src/osx/pluginSetupProcessor';
import {PLUGIN_REPO_ADDRESS} from '../../utils/constants';
import {
  ADDRESS_FIVE,
  ADDRESS_FOUR,
  ADDRESS_SIX,
  ADDRESS_THREE,
  ADDRESS_TWO,
  ADDRESS_ZERO,
  CONTRACT_ADDRESS,
  DAO_ADDRESS,
  PLUGIN_SETUP_ID,
} from '../utils/constants';
import {Address, BigInt, Bytes, ethereum} from '@graphprotocol/graph-ts';
import {assert, afterEach, clearStore, test, describe} from 'matchstick-as';

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
        const installationId = generatePluginInstallationEntityId(
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

        assert.fieldEquals(
          'DaoPlugin',
          installationIdString,
          'id',
          installationIdString
        );
        assert.entityCount('DaoPlugin', 1);
      });
    });
  });
});
