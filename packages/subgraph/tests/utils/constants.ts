import {Address} from '@graphprotocol/graph-ts';

// String and Address type constants for test scenarios:
// ADDRESS_ZERO to ADDRESS_SIX: Dummy Ethereum addresses for various test cases.
// DAO_ADDRESS: A placeholder address for a DAO instance.
// CONTRACT_ADDRESS: A placeholder address for a contract instance.
// PLUGIN_SETUP_ID: A mock identifier for a plugin setup in test simulations.
export const ADDRESS_ZERO_STRING = '0x0000000000000000000000000000000000000000';
export const ADDRESS_ZERO = Address.fromString(ADDRESS_ZERO_STRING);
export const ADDRESS_ONE_STRING = '0x0000000000000000000000000000000000000001';
export const ADDRESS_ONE = Address.fromString(ADDRESS_ONE_STRING);
export const ADDRESS_TWO_STRING = '0x0000000000000000000000000000000000000002';
export const ADDRESS_TWO = Address.fromString(ADDRESS_TWO_STRING);
export const ADDRESS_THREE_STRING =
  '0x0000000000000000000000000000000000000003';
export const ADDRESS_THREE = Address.fromString(ADDRESS_THREE_STRING);
export const ADDRESS_FOUR_STRING = '0x0000000000000000000000000000000000000004';
export const ADDRESS_FOUR = Address.fromString(ADDRESS_FOUR_STRING);
export const ADDRESS_FIVE_STRING = '0x0000000000000000000000000000000000000005';
export const ADDRESS_FIVE = Address.fromString(ADDRESS_FIVE_STRING);
export const ADDRESS_SIX_STRING = '0x0000000000000000000000000000000000000006';
export const ADDRESS_SIX = Address.fromString(ADDRESS_SIX_STRING);
export const DAO_ADDRESS_STRING = '0x00000000000000000000000000000000000000da';
export const DAO_ADDRESS = Address.fromString(DAO_ADDRESS_STRING);
export const CONTRACT_ADDRESS_STRING =
  '0x00000000000000000000000000000000000000Ad';
export const CONTRACT_ADDRESS = Address.fromString(CONTRACT_ADDRESS_STRING);
export const PLUGIN_SETUP_ID =
  '0xfb3fd2c4cd4e19944dd3f8437e67476240cd9e3efb2294ebd10c59c8f1d6817c';
