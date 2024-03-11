// Constants for test scenarios:
// ADDRESS_ZERO to ADDRESS_SIX: Dummy Ethereum addresses for various test cases.
// DAO_ADDRESS: A placeholder address for a DAO instance.
// CONTRACT_ADDRESS: A placeholder address for a contract instance.
import {
  generatePluginEntityId,
  generateProposalEntityId,
} from '@aragon/osx-commons-subgraph';
import {Address, BigInt} from '@graphprotocol/graph-ts';

// PLUGIN_SETUP_ID: A mock identifier for a plugin setup in test simulations.
export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
export const ADDRESS_ONE = '0x0000000000000000000000000000000000000001';
export const ADDRESS_TWO = '0x0000000000000000000000000000000000000002';
export const ADDRESS_THREE = '0x0000000000000000000000000000000000000003';
export const ADDRESS_FOUR = '0x0000000000000000000000000000000000000004';
export const ADDRESS_FIVE = '0x0000000000000000000000000000000000000005';
export const ADDRESS_SIX = '0x0000000000000000000000000000000000000006';
export const DAO_ADDRESS = '0x00000000000000000000000000000000000000da';
export const CONTRACT_ADDRESS = '0x00000000000000000000000000000000000000Ad';
export const PLUGIN_SETUP_ID =
  '0xfb3fd2c4cd4e19944dd3f8437e67476240cd9e3efb2294ebd10c59c8f1d6817c';

// TODO Added from OSX. This must be refactored.
export const ZERO = '0';
export const ONE = '1';
export const TWO = '2';
export const THREE = '3';

export const PLUGIN_PROPOSAL_ID = ZERO;

///
export const PROPOSAL_ENTITY_ID = generateProposalEntityId(
  Address.fromString(CONTRACT_ADDRESS),
  BigInt.fromString(PLUGIN_PROPOSAL_ID)
);

export const MIN_PROPOSER_VOTING_POWER = ZERO;
export const START_DATE = '1644851000';
export const END_DATE = '1644852000';
export const SNAPSHOT_BLOCK = '100';

export const STRING_DATA = 'Some String Data ...';

// Use 1 for testing as default value is anyways 0 and test might succeed even though it shouldn't.
export const ALLOW_FAILURE_MAP = '1';

export const DAO_TOKEN_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
export const CREATED_AT = ONE;

export const PLUGIN_ENTITY_ID = generatePluginEntityId(
  Address.fromString(CONTRACT_ADDRESS)
);
