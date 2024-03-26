import {bigIntToBytes32} from './bytes';
import {
  generateEntityIdFromAddress,
  generateEntityIdFromBytes,
} from '@aragon/osx-commons-subgraph';
import {Address, BigInt, Bytes} from '@graphprotocol/graph-ts';

export function generateTokenEntityId(tokenAddress: Address): string {
  return generateEntityIdFromAddress(tokenAddress);
}

export function generateERC1155TransferEntityId(
  txHash: Bytes,
  logIndex: BigInt,
  actionIndex: number,
  batchIndex: number
): string {
  return [
    generateEntityIdFromBytes(txHash),
    logIndex.toString(),
    actionIndex.toString(),
    batchIndex.toString(),
  ].join('_');
}

export function generateVoterEntityId(
  memberEntityId: string,
  proposalId: string
): string {
  return [memberEntityId, proposalId].join('_');
}

export function generateMemberEntityId(
  pluginAddress: Address,
  memberAddress: Address
): string {
  return [
    generateEntityIdFromAddress(pluginAddress),
    generateEntityIdFromAddress(memberAddress),
  ].join('_');
}

export function generateVoteEntityId(
  memberAddress: Address,
  proposalId: string
): string {
  return [generateEntityIdFromAddress(memberAddress), proposalId].join('_');
}

export function getProposalId(
  plugin: Address,
  pluginProposalId: BigInt
): string {
  return plugin
    .toHexString()
    .concat('_')
    .concat(bigIntToBytes32(pluginProposalId));
}

/**
 * @dev TODO: move this to OSx commons subgraph
 *
 * @param caller the user/plugin that will invoke the execute function on the DAO
 * @param daoAddress the DAO address
 * @param callId the callID determined by the user or plugin
 * @param index the index # of the action in the batch
 *
 * @returns a deterministic Action ID for an action on the DAO.
 * This implementation only relies on data that can be fetched
 * from the event logs of the `Executed` event, so can be used
 * by client applications to query both the OSx core and the plugin
 * subgraphs.
 */
export function generateActionEntityId(
  caller: Address,
  daoAddress: Address,
  callId: string,
  index: i32
): string {
  return [
    generateEntityIdFromAddress(caller),
    generateEntityIdFromAddress(daoAddress),
    callId,
    index.toString(),
  ].join('_');
}
