export const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
export const onERC721Received = '0x150b7a02';
export const ERC721_safeTransferFromNoData = '0x42842e0e';
export const ERC721_safeTransferFromWithData = '0xb88d4fde';
export const ERC721_transferFrom = '0x23b872dd';

export const ERC20_transfer = '0xa9059cbb';
export const ERC20_transferFrom = '0x23b872dd';

export const onERC1155Received = '0xf23a6e61'; // `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))` (i.e. 0xf23a6e61) if it accepts the transfer.
export const onERC1155BatchReceived = '0xbc197c81'; // `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))` (i.e. 0xbc197c81) if it accepts the transfer(s).
export const ERC1155_safeTransferFrom = '0xf242432a'; // `bytes4(keccak256("safeTransferFrom(address,address,uint256,uint256,bytes)"))` (i.e. 0xf242432a).
export const ERC1155_safeBatchTransferFrom = '0x2eb2c2d6'; // `bytes4(keccak256("safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)"))` (i.e. 0x2eb2c2d6).

export enum TransferType {
  Withdraw,
  Deposit,
}

export const DECODE_OFFSET =
  '0x0000000000000000000000000000000000000000000000000000000000000020';

export const ERC165_INTERFACE_ID = '01ffc9a7';
export const ERC1155_INTERFACE_ID = 'd9b67a26';

// AS does not support initializing Map with data, a chain of sets is used instead
export const VOTER_OPTIONS = new Map<number, string>()
  .set(0, 'None')
  .set(1, 'Abstain')
  .set(2, 'Yes')
  .set(3, 'No');

export const VOTE_OPTIONS = new Map<string, string>()
  .set('None', '0')
  .set('Abstain', '1')
  .set('Yes', '2')
  .set('No', '3');

export const VOTING_MODES = new Map<number, string>()
  .set(0, 'Standard')
  .set(1, 'EarlyExecution')
  .set(2, 'VoteReplacement');

export const VOTING_MODE_INDEXES = new Map<string, string>()
  .set('Standard', '0')
  .set('EarlyExecution', '1')
  .set('VoteReplacement', '2');

export const TOKEN_VOTING_INTERFACE_ID = '0x50eb001e';
export const ADDRESSLIST_VOTING_INTERFACE_ID = '0x5f21eb8b';
export const ADMIN_INTERFACE_ID = '0xa5793356';
export const MULTISIG_INTERFACE_ID = '0x8f852786';
export const GOVERNANCE_WRAPPED_ERC20_INTERFACE_ID = '0x0f13099a';

export const RATIO_BASE = '1000000'; // 10**6
