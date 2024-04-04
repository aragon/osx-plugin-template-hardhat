import {PLUGIN_REPO_ADDRESS} from '../../imported/repo-address';
import {handleInstallationPrepared} from '../../src/osx/pluginSetupProcessor';
import {
  ADDRESS_ZERO,
  ADDRESS_SIX,
  CONTRACT_ADDRESS,
  DAO_ADDRESS,
  DAO_ADDRESS_STRING,
  ADDRESS_TWO_STRING,
  ADDRESS_THREE_STRING,
  PLUGIN_SETUP_ID,
  ADDRESS_FOUR_STRING,
  ADDRESS_FIVE_STRING,
} from '../utils/constants';
import {createInstallationPreparedEvent} from '../utils/events';
import {generatePluginEntityId} from '@aragon/osx-commons-subgraph';
import {BigInt, Bytes, ethereum} from '@graphprotocol/graph-ts';
import {assert, afterEach, clearStore, test, describe} from 'matchstick-as';

describe('OSx', () => {
  afterEach(() => {
    clearStore();
  });

  describe('Installation', () => {
    describe('InstallationPrepared event', () => {
      test('it should store one plugin', () => {
        // Create event
        const pluginAddress = CONTRACT_ADDRESS;
        const pluginEntityId = generatePluginEntityId(CONTRACT_ADDRESS);
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
            ethereum.Value.fromAddress(DAO_ADDRESS),
            ethereum.Value.fromAddress(pluginAddress),
            ethereum.Value.fromAddress(ADDRESS_ZERO),
            ethereum.Value.fromBytes(Bytes.fromHexString('0x1234')),
          ],

          [
            ethereum.Value.fromSignedBigInt(BigInt.fromString('2')),
            ethereum.Value.fromAddress(DAO_ADDRESS),
            ethereum.Value.fromAddress(pluginAddress),
            ethereum.Value.fromAddress(ADDRESS_SIX),
            ethereum.Value.fromBytes(Bytes.fromHexString('0x5678')),
          ],
        ];

        const otherPluginSetupRepo = ADDRESS_TWO_STRING;

        const event1 = createInstallationPreparedEvent(
          ADDRESS_THREE_STRING, // sender
          DAO_ADDRESS_STRING,
          pluginAddress.toHexString(),
          Bytes.fromHexString(setupId),
          otherPluginSetupRepo,
          versionTuple,
          Bytes.fromHexString('0x00'),
          [ADDRESS_FOUR_STRING, ADDRESS_FIVE_STRING],
          permissions
        );

        handleInstallationPrepared(event1);

        assert.notInStore('MultisigPlugin', pluginEntityId!);
        assert.entityCount('MultisigPlugin', 0);

        const thisPluginRepoAddress = PLUGIN_REPO_ADDRESS;
        const pluginId = generatePluginEntityId(pluginAddress);

        const event2 = createInstallationPreparedEvent(
          ADDRESS_THREE_STRING,
          DAO_ADDRESS_STRING,
          pluginAddress.toHexString(),
          Bytes.fromHexString(setupId),
          thisPluginRepoAddress,
          versionTuple,
          Bytes.fromHexString('0x00'),
          [ADDRESS_FOUR_STRING, ADDRESS_FIVE_STRING],
          permissions
        );

        handleInstallationPrepared(event2);

        assert.entityCount('MultisigPlugin', 1);
        assert.fieldEquals('MultisigPlugin', pluginId, 'id', pluginId);
      });
    });
  });
});
