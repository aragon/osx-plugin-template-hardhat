import {Transfer as ERC20TransferEvent} from '../../generated/templates/TokenVoting/ERC20';
import {DEFAULT_MOCK_EVENT_ADDRESS} from './constants';
import {Address, BigInt, ethereum} from '@graphprotocol/graph-ts';
import {createMockedFunction, newMockEvent} from 'matchstick-as';

export function createNameCall(contractAddress: string, returns: string): void {
  createMockedFunction(
    Address.fromString(contractAddress),
    'name',
    'name():(string)'
  )
    .withArgs([])
    .returns([ethereum.Value.fromString(returns)]);
}

export function createSymbolCall(
  contractAddress: string,
  returns: string
): void {
  createMockedFunction(
    Address.fromString(contractAddress),
    'symbol',
    'symbol():(string)'
  )
    .withArgs([])
    .returns([ethereum.Value.fromString(returns)]);
}

export function createDecimalsCall(
  contractAddress: string,
  returns: string
): void {
  createMockedFunction(
    Address.fromString(contractAddress),
    'decimals',
    'decimals():(uint8)'
  )
    .withArgs([])
    .returns([ethereum.Value.fromUnsignedBigInt(BigInt.fromString(returns))]);
}

export function createTotalSupplyCall(
  contractAddress: string,
  returns: string
): void {
  createMockedFunction(
    Address.fromString(contractAddress),
    'totalSupply',
    'totalSupply():(uint256)'
  )
    .withArgs([])
    .returns([ethereum.Value.fromSignedBigInt(BigInt.fromString(returns))]);
}

export function getBalanceOf(
  contractAddress: string,
  account: string,
  returns: string
): void {
  createMockedFunction(
    Address.fromString(contractAddress),
    'balanceOf',
    'balanceOf(address):(uint256)'
  )
    .withArgs([ethereum.Value.fromAddress(Address.fromString(account))])
    .returns([ethereum.Value.fromSignedBigInt(BigInt.fromString(returns))]);
}

export function createNewERC20TransferEvent(
  from: string,
  to: string,
  amount: string
): ERC20TransferEvent {
  return createNewERC20TransferEventWithAddress(
    from,
    to,
    amount,
    DEFAULT_MOCK_EVENT_ADDRESS
  );
}

export function createNewERC20TransferEventWithAddress(
  from: string,
  to: string,
  amount: string,
  contractAddress: string
): ERC20TransferEvent {
  let transferEvent = changetype<ERC20TransferEvent>(newMockEvent());
  let fromParam = new ethereum.EventParam(
    'from',
    ethereum.Value.fromAddress(Address.fromString(from))
  );
  let toParam = new ethereum.EventParam(
    'to',
    ethereum.Value.fromAddress(Address.fromString(to))
  );
  let amountParam = new ethereum.EventParam(
    'amount',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(amount))
  );
  transferEvent.address = Address.fromString(contractAddress);
  transferEvent.parameters.push(fromParam);
  transferEvent.parameters.push(toParam);
  transferEvent.parameters.push(amountParam);
  return transferEvent;
}
