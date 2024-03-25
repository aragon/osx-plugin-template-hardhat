import {PLUGIN_REPO_ADDRESS} from '../../imported/repo-address';
import {handleInstallationPrepared} from '../../src/osx/pluginSetupProcessor';
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
import {createInstallationPreparedEvent} from '../utils/events';
import {generatePluginEntityId} from '@aragon/osx-commons-subgraph';
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
        const pluginEntityId = generatePluginEntityId(
          Address.fromString(pluginAddress)
        );
        if (!pluginEntityId) {
          throw new Error('Failed to get pluginEntityId');
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

        assert.notInStore('MultisigPlugin', pluginEntityId!);
        assert.entityCount('MultisigPlugin', 0);

        const thisPluginRepoAddress = PLUGIN_REPO_ADDRESS;
        const pluginId = generatePluginEntityId(
          Address.fromString(pluginAddress)
        );

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

        assert.entityCount('MultisigPlugin', 1);
        assert.fieldEquals('MultisigPlugin', pluginId, 'id', pluginId);
      });
    });
  });
});
