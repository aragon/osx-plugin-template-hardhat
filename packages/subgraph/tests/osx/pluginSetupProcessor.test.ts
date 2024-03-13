import {PLUGIN_REPO_ADDRESS} from '../../imported/repo-address';
import {handleInstallationPrepared} from '../../src/osx/pluginSetupProcessor';
import {
  GOVERNANCE_WRAPPED_ERC20_INTERFACE_ID,
  TOKEN_VOTING_INTERFACE_ID,
} from '../../src/utils/constants';
import {
  createDecimalsCall,
  createGetVotingTokenCall,
  createMinDurationCall,
  createMinParticipationCall,
  createNameCall,
  createSupportThresholdCall,
  createSymbolCall,
  createTotalSupplyCall,
  getBalanceOf,
  getSupportsInterface,
} from '../plugin/utils';
import {
  ADDRESS_FIVE,
  ADDRESS_FOUR,
  ADDRESS_SIX,
  ADDRESS_THREE,
  ADDRESS_TWO,
  ADDRESS_ZERO,
  CONTRACT_ADDRESS,
  DAO_ADDRESS,
  DAO_TOKEN_ADDRESS,
  PLUGIN_SETUP_ID,
} from '../utils/constants';
import {createInstallationPreparedEvent} from '../utils/events';
import {generatePluginInstallationEntityId} from '@aragon/osx-commons-subgraph';
import {
  Address,
  BigInt,
  ByteArray,
  Bytes,
  ethereum,
  log,
} from '@graphprotocol/graph-ts';
import {
  assert,
  afterEach,
  clearStore,
  test,
  describe,
  beforeEach,
} from 'matchstick-as';

describe('OSx', () => {
  beforeEach(() => {
    createSupportThresholdCall(CONTRACT_ADDRESS, '1');
    createMinParticipationCall(CONTRACT_ADDRESS, '1');
    createMinDurationCall(CONTRACT_ADDRESS, '1');

    createGetVotingTokenCall(CONTRACT_ADDRESS, DAO_TOKEN_ADDRESS);

    createNameCall(DAO_TOKEN_ADDRESS, 'DAO Token');
    createSymbolCall(DAO_TOKEN_ADDRESS, 'DAO');
    createDecimalsCall(DAO_TOKEN_ADDRESS, '18');
    createTotalSupplyCall(DAO_TOKEN_ADDRESS, '1');
    // this is used by the wrapped erc20 to check the
    // token is an ERC20, hence the token calling its own
    // balance, which is somewhat nonsensical in another context
    getBalanceOf(DAO_TOKEN_ADDRESS, DAO_TOKEN_ADDRESS, '1');

    getSupportsInterface(
      DAO_TOKEN_ADDRESS,
      GOVERNANCE_WRAPPED_ERC20_INTERFACE_ID,
      false
    );
    getSupportsInterface(CONTRACT_ADDRESS, TOKEN_VOTING_INTERFACE_ID, true);
  });
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

        assert.notInStore('TokenVotingPlugin', installationId!);
        assert.entityCount('TokenVotingPlugin', 0);

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

        assert.entityCount('TokenVotingPlugin', 1);
        assert.fieldEquals(
          'TokenVotingPlugin',
          installationId!,
          'id',
          installationId!
        );
      });
    });
  });
});
