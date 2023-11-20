import {NumberStored} from '../../generated/templates/Plugin/Plugin';
import {Address, BigInt, ethereum} from '@graphprotocol/graph-ts';
import {newMockEvent} from 'matchstick-as';

export function createNewNumberStoredEvent(
  number: string,
  contractAddress: string
): NumberStored {
  let createNumberStoredEvent = changetype<NumberStored>(newMockEvent());

  createNumberStoredEvent.address = Address.fromString(contractAddress);
  createNumberStoredEvent.parameters = [];

  let proposalIdParam = new ethereum.EventParam(
    'number',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(number))
  );

  createNumberStoredEvent.parameters.push(proposalIdParam);

  return createNumberStoredEvent;
}
