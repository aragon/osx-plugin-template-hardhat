import {generateEntityIdFromAddress} from '@aragon/osx-commons-subgraph';
import {Address} from '@graphprotocol/graph-ts';

export function generateMemberEntityId(
  pluginAddress: Address,
  memberAddress: Address
): string {
  return [
    generateEntityIdFromAddress(pluginAddress),
    generateEntityIdFromAddress(memberAddress),
  ].join('_');
}

export function generateVoterEntityId(
  memberEntityId: string,
  proposalId: string
): string {
  return [memberEntityId, proposalId].join('_');
}
