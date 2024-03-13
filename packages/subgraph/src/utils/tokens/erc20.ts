import {ERC20Contract, ERC20WrapperContract} from '../../../generated/schema';
import {ERC20} from '../../../generated/templates/TokenVoting/ERC20';
import {GovernanceWrappedERC20} from '../../../generated/templates/TokenVoting/GovernanceWrappedERC20';
import {GOVERNANCE_WRAPPED_ERC20_INTERFACE_ID} from '../constants';
import {supportsInterface} from '../erc165';
import {generateTokenEntityId} from '../ids';
import {Address} from '@graphprotocol/graph-ts';

export function supportsERC20Wrapped(token: Address): bool {
  // Double check that it's ERC20Wrapped by calling supportsInterface checks.
  const erc20Wrapped = GovernanceWrappedERC20.bind(token);
  const introspection_wrapped_erc20 = supportsInterface(
    erc20Wrapped,
    GOVERNANCE_WRAPPED_ERC20_INTERFACE_ID
  ); // GovernanceWrappedERC20
  if (!introspection_wrapped_erc20) {
    return false;
  }
  const introspection_ffffffff = supportsInterface(
    erc20Wrapped,
    'ffffffff',
    false
  );
  return introspection_ffffffff;
}

export function fetchOrCreateWrappedERC20Entity(
  address: Address
): ERC20WrapperContract | null {
  const tokenEntityId = generateTokenEntityId(address);
  const wrappedErc20 = GovernanceWrappedERC20.bind(address);
  // try load entry
  let contract = ERC20WrapperContract.load(tokenEntityId);
  if (contract != null) {
    return contract;
  }

  contract = new ERC20WrapperContract(tokenEntityId);

  const try_name = wrappedErc20.try_name();
  const try_symbol = wrappedErc20.try_symbol();
  const totalSupply = wrappedErc20.try_totalSupply();
  const try_decimals = wrappedErc20.try_decimals();
  // extra checks
  const balanceOf = wrappedErc20.try_balanceOf(address);
  const underlying = wrappedErc20.try_underlying();
  if (totalSupply.reverted || balanceOf.reverted || underlying.reverted) {
    return null;
  }
  // get and save the underliying contract
  const underlyingContract = fetchOrCreateERC20Entity(underlying.value);
  if (!underlyingContract) {
    return null;
  }
  // set params and save
  contract.name = try_name.reverted ? '' : try_name.value;
  contract.symbol = try_symbol.reverted ? '' : try_symbol.value;
  contract.decimals = try_decimals.reverted ? 18 : try_decimals.value;
  contract.underlyingToken = underlyingContract.id;
  contract.save();
  return contract;
}

export function fetchOrCreateERC20Entity(
  address: Address
): ERC20Contract | null {
  const tokenEntityId = generateTokenEntityId(address);
  const erc20 = ERC20.bind(address);

  // Try load entry
  let contract = ERC20Contract.load(tokenEntityId);
  if (contract != null) {
    return contract;
  }

  contract = new ERC20Contract(tokenEntityId);

  const try_name = erc20.try_name();
  const try_symbol = erc20.try_symbol();
  const try_decimals = erc20.try_decimals();

  // Extra check to make sure contract is ERC20.
  const totalSupply = erc20.try_totalSupply();
  const balanceOf = erc20.try_balanceOf(address);
  if (totalSupply.reverted || balanceOf.reverted) {
    return null;
  }

  contract.name = try_name.reverted ? '' : try_name.value;
  contract.symbol = try_symbol.reverted ? '' : try_symbol.value;
  contract.decimals = try_decimals.reverted ? 18 : try_decimals.value;
  contract.save();

  return contract;
}

/**
 * @dev Identifies the type of ERC20 token (wrapped or regular), fetches or creates the corresponding entity, and returns its entity ID.
 *
 * 1. Checks whether the token supports wrapped ERC20.
 * 2. Fetches the existing entity if it exists.
 * 3. Creates a new entity if it doesn't exist.
 *
 * @param token The address of the token to be identified.
 * @return entityId The entity ID of the ERC20 token if it's either wrapped or regular, null otherwise.
 */
export function identifyAndFetchOrCreateERC20TokenEntity(
  token: Address
): string | null {
  let tokenAddress: string;
  if (supportsERC20Wrapped(token)) {
    const contract = fetchOrCreateWrappedERC20Entity(token);
    if (!contract) {
      return null;
    }
    tokenAddress = contract.id;
  } else {
    const contract = fetchOrCreateERC20Entity(token);
    if (!contract) {
      return null;
    }
    tokenAddress = contract.id;
  }

  return tokenAddress;
}
