import {TokenVotingMember, TokenVotingProposal} from '../../generated/schema';
import {
  DelegateChanged,
  DelegateVotesChanged,
} from '../../generated/templates/GovernanceERC20/GovernanceERC20';
import {Transfer as ERC20TransferEvent} from '../../generated/templates/TokenVoting/ERC20';
import {
  VotingSettingsUpdated,
  VoteCast,
  ProposalCreated,
  ProposalExecuted,
  MembershipContractAnnounced,
} from '../../generated/templates/TokenVoting/TokenVoting';
import {generateMemberEntityId} from '../../src/utils/ids';
import {
  ADDRESS_ONE,
  DAO_ADDRESS,
  PROPOSAL_ENTITY_ID,
  PLUGIN_PROPOSAL_ID,
  CONTRACT_ADDRESS,
  VOTING_MODE,
  SUPPORT_THRESHOLD,
  MIN_VOTING_POWER,
  START_DATE,
  END_DATE,
  SNAPSHOT_BLOCK,
  TOTAL_VOTING_POWER,
  CREATED_AT,
  ALLOW_FAILURE_MAP,
  DEFAULT_MOCK_EVENT_ADDRESS,
} from '../utils/constants';
import {Address, BigInt, Bytes, ethereum} from '@graphprotocol/graph-ts';
import {createMockedFunction, newMockEvent} from 'matchstick-as';

// events

export function createNewProposalCreatedEvent(
  proposalId: string,
  creator: string,
  startDate: string,
  endDate: string,
  description: string,
  actions: ethereum.Tuple[],
  allowFailureMap: string,
  contractAddress: string
): ProposalCreated {
  let createProposalCreatedEvent = changetype<ProposalCreated>(newMockEvent());

  createProposalCreatedEvent.address = Address.fromString(contractAddress);
  createProposalCreatedEvent.parameters = [];

  let proposalIdParam = new ethereum.EventParam(
    'proposalId',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(proposalId))
  );
  let creatorParam = new ethereum.EventParam(
    'creator',
    ethereum.Value.fromAddress(Address.fromString(creator))
  );
  let startDateParam = new ethereum.EventParam(
    'startDate',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(startDate))
  );
  let endDateParam = new ethereum.EventParam(
    'endDate',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(endDate))
  );
  let descriptionParam = new ethereum.EventParam(
    'description',
    ethereum.Value.fromBytes(Bytes.fromUTF8(description))
  );
  let actionsParam = new ethereum.EventParam(
    'actions',
    ethereum.Value.fromTupleArray(actions)
  );
  let allowFailureMapParam = new ethereum.EventParam(
    'allowFailureMap',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(allowFailureMap))
  );

  createProposalCreatedEvent.parameters.push(proposalIdParam);
  createProposalCreatedEvent.parameters.push(creatorParam);
  createProposalCreatedEvent.parameters.push(startDateParam);
  createProposalCreatedEvent.parameters.push(endDateParam);
  createProposalCreatedEvent.parameters.push(descriptionParam);
  createProposalCreatedEvent.parameters.push(actionsParam);
  createProposalCreatedEvent.parameters.push(allowFailureMapParam);

  return createProposalCreatedEvent;
}

export function createNewVoteCastEvent(
  proposalId: string,
  voter: string,
  voteOption: string,
  votingPower: string,
  contractAddress: string
): VoteCast {
  let createProposalCastEvent = changetype<VoteCast>(newMockEvent());

  createProposalCastEvent.address = Address.fromString(contractAddress);
  createProposalCastEvent.parameters = [];

  let proposalIdParam = new ethereum.EventParam(
    'proposalId',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(proposalId))
  );
  let voterParam = new ethereum.EventParam(
    'voter',
    ethereum.Value.fromAddress(Address.fromString(voter))
  );
  let voteOptionParam = new ethereum.EventParam(
    'voteOption',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(voteOption))
  );
  let votingPowerParam = new ethereum.EventParam(
    'votingPower',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(votingPower))
  );

  createProposalCastEvent.parameters.push(proposalIdParam);
  createProposalCastEvent.parameters.push(voterParam);
  createProposalCastEvent.parameters.push(voteOptionParam);
  createProposalCastEvent.parameters.push(votingPowerParam);

  return createProposalCastEvent;
}

export function createNewProposalExecutedEvent(
  proposalId: string,
  contractAddress: string
): ProposalExecuted {
  let createProposalExecutedEvent = changetype<ProposalExecuted>(
    newMockEvent()
  );

  createProposalExecutedEvent.address = Address.fromString(contractAddress);
  createProposalExecutedEvent.parameters = [];

  let proposalIdParam = new ethereum.EventParam(
    'proposalId',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(proposalId))
  );

  createProposalExecutedEvent.parameters.push(proposalIdParam);

  return createProposalExecutedEvent;
}

export function createNewVotingSettingsUpdatedEvent(
  votingMode: string,
  supportThreshold: string,
  minParticipation: string,
  minDuration: string,
  minProposerVotingPower: string,
  contractAddress: string
): VotingSettingsUpdated {
  let newVotingSettingsUpdatedEvent = changetype<VotingSettingsUpdated>(
    newMockEvent()
  );

  newVotingSettingsUpdatedEvent.address = Address.fromString(contractAddress);
  newVotingSettingsUpdatedEvent.parameters = [];

  let votingModeParam = new ethereum.EventParam(
    'votingMode',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(votingMode))
  );
  let supportThresholdParam = new ethereum.EventParam(
    'supportThreshold',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(supportThreshold))
  );
  let minParticipationParam = new ethereum.EventParam(
    'minParticipation',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(minParticipation))
  );
  let minDurationParam = new ethereum.EventParam(
    'minDuration',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(minDuration))
  );
  let minProposerVotingPowerParam = new ethereum.EventParam(
    'minProposerVotingPower',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(minProposerVotingPower))
  );

  newVotingSettingsUpdatedEvent.parameters.push(votingModeParam);
  newVotingSettingsUpdatedEvent.parameters.push(supportThresholdParam);
  newVotingSettingsUpdatedEvent.parameters.push(minParticipationParam);
  newVotingSettingsUpdatedEvent.parameters.push(minDurationParam);
  newVotingSettingsUpdatedEvent.parameters.push(minProposerVotingPowerParam);

  return newVotingSettingsUpdatedEvent;
}

export function createNewDelegateChangedEvent(
  delegator: string,
  fromDelegate: string,
  toDelegate: string,
  contractAddress: string
): DelegateChanged {
  let newDelegateChangedEvent = changetype<DelegateChanged>(newMockEvent());

  newDelegateChangedEvent.address = Address.fromString(contractAddress);
  newDelegateChangedEvent.parameters = [];

  let delegatorParam = new ethereum.EventParam(
    'delegator',
    ethereum.Value.fromAddress(Address.fromString(delegator))
  );
  let fromDelegateParam = new ethereum.EventParam(
    'fromDelegate',
    ethereum.Value.fromAddress(Address.fromString(fromDelegate))
  );
  let toDelegateParam = new ethereum.EventParam(
    'toDelegate',
    ethereum.Value.fromAddress(Address.fromString(toDelegate))
  );

  newDelegateChangedEvent.parameters.push(delegatorParam);
  newDelegateChangedEvent.parameters.push(fromDelegateParam);
  newDelegateChangedEvent.parameters.push(toDelegateParam);

  return newDelegateChangedEvent;
}

export function createNewDelegateVotesChangedEvent(
  delegate: string,
  previousBalance: string,
  newBalance: string,
  contractAddress: string
): DelegateVotesChanged {
  let newDelegateVotesChangedEvent = changetype<DelegateVotesChanged>(
    newMockEvent()
  );

  newDelegateVotesChangedEvent.address = Address.fromString(contractAddress);
  newDelegateVotesChangedEvent.parameters = [];

  let delegateParam = new ethereum.EventParam(
    'delegate',
    ethereum.Value.fromAddress(Address.fromString(delegate))
  );
  let previousBalanceParam = new ethereum.EventParam(
    'previousBalance',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(previousBalance))
  );
  let newBalanceParam = new ethereum.EventParam(
    'newBalance',
    ethereum.Value.fromSignedBigInt(BigInt.fromString(newBalance))
  );

  newDelegateVotesChangedEvent.parameters.push(delegateParam);
  newDelegateVotesChangedEvent.parameters.push(previousBalanceParam);
  newDelegateVotesChangedEvent.parameters.push(newBalanceParam);

  return newDelegateVotesChangedEvent;
}
export function createNewMembershipContractAnnouncedEvent(
  definingContract: string,
  contractAddress: string
): MembershipContractAnnounced {
  let newMembershipContractAnnounced = changetype<MembershipContractAnnounced>(
    newMockEvent()
  );

  newMembershipContractAnnounced.address = Address.fromString(contractAddress);
  newMembershipContractAnnounced.parameters = [];

  let definingContractParam = new ethereum.EventParam(
    'definingContract',
    ethereum.Value.fromAddress(Address.fromString(definingContract))
  );

  newMembershipContractAnnounced.parameters.push(definingContractParam);

  return newMembershipContractAnnounced;
}

// calls

export function getProposalCountCall(
  contractAddress: string,
  returns: string
): void {
  createMockedFunction(
    Address.fromString(contractAddress),
    'proposalCount',
    'proposalCount():(uint256)'
  )
    .withArgs([])
    .returns([ethereum.Value.fromSignedBigInt(BigInt.fromString(returns))]);
}

export function delegatesCall(
  contractAddress: string,
  account: string,
  returns: string
): void {
  createMockedFunction(
    Address.fromString(contractAddress),
    'delegates',
    'delegates(address):(address)'
  )
    .withArgs([ethereum.Value.fromAddress(Address.fromString(account))])
    .returns([ethereum.Value.fromAddress(Address.fromString(returns))]);
}

// state

export function createTokenVotingProposalEntityState(
  entityID: string = PROPOSAL_ENTITY_ID,
  dao: string = DAO_ADDRESS,
  pkg: string = CONTRACT_ADDRESS,
  creator: string = ADDRESS_ONE,
  pluginProposalId: string = PLUGIN_PROPOSAL_ID,

  open: boolean = true,
  executed: boolean = false,

  votingMode: string = VOTING_MODE,
  supportThreshold: string = SUPPORT_THRESHOLD,
  minVotingPower: string = MIN_VOTING_POWER,
  startDate: string = START_DATE,
  endDate: string = END_DATE,
  snapshotBlock: string = SNAPSHOT_BLOCK,

  totalVotingPower: string = TOTAL_VOTING_POWER,
  allowFailureMap: string = ALLOW_FAILURE_MAP,
  createdAt: string = CREATED_AT,
  creationBlockNumber: BigInt = new BigInt(0),
  executable: boolean = false,
  earlyExecutable: boolean = false
): TokenVotingProposal {
  let tokenVotingProposal = new TokenVotingProposal(entityID);
  tokenVotingProposal.dao = Address.fromString(dao).toHexString();
  tokenVotingProposal.plugin = Address.fromString(pkg).toHexString();
  tokenVotingProposal.pluginProposalId = BigInt.fromString(pluginProposalId);
  tokenVotingProposal.creator = Address.fromString(creator);

  tokenVotingProposal.open = open;
  tokenVotingProposal.executed = executed;

  tokenVotingProposal.votingMode = votingMode;
  tokenVotingProposal.supportThreshold = BigInt.fromString(supportThreshold);
  tokenVotingProposal.minVotingPower = BigInt.fromString(minVotingPower);
  tokenVotingProposal.startDate = BigInt.fromString(startDate);
  tokenVotingProposal.endDate = BigInt.fromString(endDate);
  tokenVotingProposal.snapshotBlock = BigInt.fromString(snapshotBlock);
  tokenVotingProposal.isSignaling = false;

  tokenVotingProposal.totalVotingPower = BigInt.fromString(totalVotingPower);
  tokenVotingProposal.allowFailureMap = BigInt.fromString(allowFailureMap);
  tokenVotingProposal.createdAt = BigInt.fromString(createdAt);
  tokenVotingProposal.creationBlockNumber = creationBlockNumber;
  tokenVotingProposal.approvalReached = executable;
  tokenVotingProposal.earlyExecutable = earlyExecutable;

  tokenVotingProposal.save();

  return tokenVotingProposal;
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

export function createTokenVotingMember(
  address: string,
  plugin: string,
  balance: string
): string {
  const memberEntityId = generateMemberEntityId(
    Address.fromString(plugin), // uses other plugin address to make sure that the code reuses the entity
    Address.fromString(address)
  );

  const user = new TokenVotingMember(memberEntityId);
  user.address = Address.fromString(address);
  user.plugin = plugin; // uses other plugin address to make sure that the code reuses the entity
  user.balance = BigInt.fromString(balance);

  user.delegatee = memberEntityId;
  user.votingPower = BigInt.zero();
  user.save();

  return memberEntityId;
}

export function getDelegatee(
  contractAddress: string,
  account: string,
  returns: string | null
): void {
  const returnsValue = returns
    ? ethereum.Value.fromAddress(Address.fromString(returns))
    : ethereum.Value.fromAddress(Address.zero());
  createMockedFunction(
    Address.fromString(contractAddress),
    'delegates',
    'delegates(address):(address)'
  )
    .withArgs([ethereum.Value.fromAddress(Address.fromString(account))])
    .returns([returnsValue]);
}

export function getVotes(
  contractAddress: string,
  account: string,
  returns: string
): void {
  createMockedFunction(
    Address.fromString(contractAddress),
    'getVotes',
    'getVotes(address):(uint256)'
  )
    .withArgs([ethereum.Value.fromAddress(Address.fromString(account))])
    .returns([ethereum.Value.fromSignedBigInt(BigInt.fromString(returns))]);
}

export function createMockGetter(
  contractAddress: string,
  funcName: string,
  funcSignature: string,
  returns: ethereum.Value[]
): void {
  createMockedFunction(
    Address.fromString(contractAddress),
    funcName,
    funcSignature
  )
    .withArgs([])
    .returns(returns);
}

export function createGetProposalCall(
  contractAddress: string,
  proposalId: string,
  open: boolean,
  executed: boolean,

  votingMode: string,
  supportThreshold: string,
  minVotingPower: string,
  startDate: string,
  endDate: string,
  snapshotBlock: string,

  abstain: string,
  yes: string,
  no: string,

  actions: ethereum.Tuple[],
  allowFailureMap: string
): void {
  let parameters = new ethereum.Tuple();

  parameters.push(
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(votingMode))
  );
  parameters.push(
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(supportThreshold))
  );
  parameters.push(
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(startDate))
  );
  parameters.push(
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(endDate))
  );
  parameters.push(
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(snapshotBlock))
  );
  parameters.push(
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(minVotingPower))
  );

  let tally = new ethereum.Tuple();

  tally.push(ethereum.Value.fromUnsignedBigInt(BigInt.fromString(abstain)));
  tally.push(ethereum.Value.fromUnsignedBigInt(BigInt.fromString(yes)));
  tally.push(ethereum.Value.fromUnsignedBigInt(BigInt.fromString(no)));

  createMockedFunction(
    Address.fromString(contractAddress),
    'getProposal',
    'getProposal(uint256):(bool,bool,(uint8,uint32,uint64,uint64,uint64,uint256),(uint256,uint256,uint256),(address,uint256,bytes)[],uint256)'
  )
    .withArgs([
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString(proposalId)),
    ])
    .returns([
      ethereum.Value.fromBoolean(open),
      ethereum.Value.fromBoolean(executed),

      // ProposalParameters
      ethereum.Value.fromTuple(parameters),

      // Tally
      ethereum.Value.fromTuple(tally),

      ethereum.Value.fromTupleArray(actions),

      ethereum.Value.fromUnsignedBigInt(BigInt.fromString(allowFailureMap)),
    ]);
}

export function createTotalVotingPowerCall(
  contractAddress: string,
  blockNumber: string,

  totalVotingPower: string
): void {
  createMockedFunction(
    Address.fromString(contractAddress),
    'totalVotingPower',
    'totalVotingPower(uint256):(uint256)'
  )
    .withArgs([
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString(blockNumber)),
    ])
    .returns([
      ethereum.Value.fromUnsignedBigInt(BigInt.fromString(totalVotingPower)),
    ]);
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
