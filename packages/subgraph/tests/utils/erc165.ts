import {Address, Bytes, ethereum} from '@graphprotocol/graph-ts';
import {createMockedFunction} from 'matchstick-as';

export function getSupportsInterface(
  contractAddress: string,
  interfaceId: string,
  returns: boolean
): void {
  createMockedFunction(
    Address.fromString(contractAddress),
    'supportsInterface',
    'supportsInterface(bytes4):(bool)'
  )
    .withArgs([
      ethereum.Value.fromFixedBytes(Bytes.fromHexString(interfaceId) as Bytes),
    ])
    .returns([ethereum.Value.fromBoolean(returns)]);
}
