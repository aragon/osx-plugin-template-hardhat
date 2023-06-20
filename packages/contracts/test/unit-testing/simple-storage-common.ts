import {ethers} from 'hardhat';

export const abiCoder = ethers.utils.defaultAbiCoder;
export const EMPTY_DATA = '0x';

export const STORE_PERMISSION_ID = ethers.utils.id('STORE_PERMISSION');

export const ADDRESS_ZERO = ethers.constants.AddressZero;
export const ADDRESS_ONE = `0x${'0'.repeat(39)}1`;
export const ADDRESS_TWO = `0x${'0'.repeat(39)}2`;
export const NO_CONDITION = ADDRESS_ZERO;
