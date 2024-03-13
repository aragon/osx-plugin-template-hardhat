/**
 * IMPORTANT: Do not export classes from this file.
 * The classes of this file are meant to be incorporated into the classes of ./extended-schema.ts
 */
import {
  TokenVotingMember,
  ERC20WrapperContract,
  TokenVotingPlugin,
  TokenVotingProposal,
  TokenVotingVote,
  TokenVotingVoter,
  ERC20Contract,
} from '../../generated/schema';
import {
  DelegateChanged,
  DelegateVotesChanged,
} from '../../generated/templates/GovernanceERC20/GovernanceERC20';
import {
  MembershipContractAnnounced,
  ProposalCreated,
  ProposalExecuted,
  VoteCast,
  VotingSettingsUpdated,
} from '../../generated/templates/TokenVoting/TokenVoting';
import {
  VOTER_OPTIONS,
  VOTE_OPTIONS,
  VOTING_MODES,
  VOTING_MODE_INDEXES,
} from '../../src/utils/constants';
import {generateMemberEntityId} from '../../src/utils/ids';
import {getTransferId} from '../../src/utils/tokens/common';
import {
  createNewDelegateChangedEvent,
  createNewDelegateVotesChangedEvent,
  createNewMembershipContractAnnouncedEvent,
  createNewProposalCreatedEvent,
  createNewProposalExecutedEvent,
  createNewVoteCastEvent,
  createNewVotingSettingsUpdatedEvent,
  delegatesCall,
  getBalanceOf,
  getProposalCountCall,
  getSupportsInterface,
} from '../plugin/utils';
import {
  createGetProposalCall,
  createTotalVotingPowerCall,
} from '../plugin/utils';
import {
  ADDRESS_ONE,
  ALLOW_FAILURE_MAP,
  CONTRACT_ADDRESS,
  CREATED_AT,
  DAO_ADDRESS,
  END_DATE,
  MIN_VOTING_POWER,
  PROPOSAL_ENTITY_ID,
  PLUGIN_PROPOSAL_ID,
  SNAPSHOT_BLOCK,
  START_DATE,
  SUPPORT_THRESHOLD,
  TOTAL_VOTING_POWER,
  TWO,
  VOTING_MODE,
  ZERO,
  MIN_PARTICIPATION,
  MIN_DURATION,
  DAO_TOKEN_ADDRESS,
  STRING_DATA,
  ADDRESS_ZERO,
} from '../utils/constants';
import {
  generateEntityIdFromAddress,
  generatePluginEntityId,
  createERC20TokenCalls,
  createWrappedERC20TokenCalls,
} from '@aragon/osx-commons-subgraph';
import {Address, BigInt, Bytes, ethereum} from '@graphprotocol/graph-ts';

class ERC20WrapperContractMethods extends ERC20WrapperContract {
  withDefaultValues(): ERC20WrapperContractMethods {
    this.id = Address.fromHexString(CONTRACT_ADDRESS).toHexString();
    this.name = 'Wrapped Test Token';
    this.symbol = 'WTT';
    this.decimals = 18;
    this.underlyingToken =
      Address.fromHexString(DAO_TOKEN_ADDRESS).toHexString();
    return this;
  }
  // calls
  mockCall_createTokenCalls(totalSupply: string | null = null): void {
    if (!this.name) {
      throw new Error('Name is null');
    } else if (!this.symbol) {
      throw new Error('Symbol is null');
    } else if (!this.underlyingToken) {
      throw new Error('Underlying token is null');
    }
    let supply = '10';
    if (totalSupply) {
      supply = totalSupply;
    }

    createWrappedERC20TokenCalls(
      this.id,
      this.underlyingToken,
      supply,
      this.name as string,
      this.symbol as string
    );
  }

  mockCall_supportsInterface(interfaceId: string, value: boolean): void {
    getSupportsInterface(this.id, interfaceId, value);
  }

  mockCall_balanceOf(account: string, amount: string): void {
    getBalanceOf(this.id, account, amount);
  }
}

class ERC20ContractMethods extends ERC20Contract {
  withDefaultValues(): ERC20ContractMethods {
    this.id = Address.fromHexString(DAO_TOKEN_ADDRESS).toHexString();
    this.name = 'DAO Token';
    this.symbol = 'DAOT';
    this.decimals = 6;

    return this;
  }

  // calls
  mockCall_createTokenCalls(totalSupply: string | null = null): void {
    if (!this.name) {
      throw new Error('Name is null');
    }
    if (!this.symbol) {
      throw new Error('Symbol is null');
    }
    let supply = '10';
    if (totalSupply) {
      supply = totalSupply;
    }
    // we cast to string only for stoping rust compiler complaints.
    createERC20TokenCalls(
      this.id,
      supply,
      this.name as string,
      this.symbol as string,
      this.decimals.toString()
    );
  }

  mockCall_supportsInterface(interfaceId: string, value: boolean): void {
    getSupportsInterface(this.id, interfaceId, value);
  }

  mockCall_balanceOf(account: string, amount: string): void {
    getBalanceOf(this.id, account, amount);
  }
}

// Token Voting
class TokenVotingVoterMethods extends TokenVotingVoter {
  withDefaultValues(): TokenVotingVoterMethods {
    const memberAddress = Address.fromString(ADDRESS_ONE);
    const memberId = generateEntityIdFromAddress(memberAddress);
    const pluginAddress = Address.fromString(CONTRACT_ADDRESS);
    const pluginEntityId = generatePluginEntityId(pluginAddress);
    this.id = generateMemberEntityId(pluginAddress, memberAddress);
    this.address = memberId;
    this.plugin = pluginEntityId;
    this.lastUpdated = BigInt.zero();

    return this;
  }
}

class TokenVotingProposalMethods extends TokenVotingProposal {
  withDefaultValues(): TokenVotingProposalMethods {
    this.id = PROPOSAL_ENTITY_ID;

    this.dao = Bytes.fromHexString(DAO_ADDRESS);
    this.plugin = Address.fromHexString(CONTRACT_ADDRESS).toHexString();
    this.pluginProposalId = BigInt.fromString(PLUGIN_PROPOSAL_ID);
    this.creator = Address.fromHexString(ADDRESS_ONE);

    this.open = true;
    this.executed = false;

    this.votingMode = VOTING_MODE;
    this.supportThreshold = BigInt.fromString(SUPPORT_THRESHOLD);
    this.minVotingPower = BigInt.fromString(MIN_VOTING_POWER);
    this.startDate = BigInt.fromString(START_DATE);
    this.endDate = BigInt.fromString(END_DATE);
    this.snapshotBlock = BigInt.fromString(SNAPSHOT_BLOCK);

    this.yes = BigInt.fromString(ZERO);
    this.no = BigInt.fromString(ZERO);
    this.abstain = BigInt.fromString(ZERO);
    this.castedVotingPower = BigInt.fromString(ZERO);

    this.totalVotingPower = BigInt.fromString(TOTAL_VOTING_POWER);
    this.allowFailureMap = BigInt.fromString(ALLOW_FAILURE_MAP);
    this.createdAt = BigInt.fromString(CREATED_AT);
    this.creationBlockNumber = BigInt.fromString(ZERO);
    this.approvalReached = false;
    this.isSignaling = false;

    return this;
  }

  // calls
  // (only read call from contracts related to this)
  mockCall_getProposal(actions: ethereum.Tuple[]): void {
    if (!this.yes || !this.no || !this.abstain) {
      throw new Error('Yes, No, or Abstain can not be null');
    } else {
      createGetProposalCall(
        this.plugin,
        this.pluginProposalId.toString(),
        this.open,
        this.executed,
        this.votingMode,
        this.supportThreshold.toString(),
        this.minVotingPower.toString(),
        this.startDate.toString(),
        this.endDate.toString(),
        this.snapshotBlock.toString(),
        (this.abstain as BigInt).toString(),
        (this.yes as BigInt).toString(),
        (this.no as BigInt).toString(),
        actions,
        this.allowFailureMap.toString()
      );
    }
  }

  mockCall_totalVotingPower(): void {
    createTotalVotingPowerCall(
      this.plugin,
      this.snapshotBlock.toString(),
      this.totalVotingPower.toString()
    );
  }

  // event
  createEvent_ProposalCreated(
    actions: ethereum.Tuple[],
    description: string = STRING_DATA
  ): ProposalCreated {
    let event = createNewProposalCreatedEvent(
      this.pluginProposalId.toString(),
      this.creator.toHexString(),
      this.startDate.toString(),
      this.endDate.toString(),
      description,
      actions,
      this.allowFailureMap.toString(),
      this.plugin
    );

    return event;
  }

  createEvent_VoteCast(
    voter: string,
    voterVoteOption: string,
    voterVotingPower: string
  ): VoteCast {
    if (!VOTE_OPTIONS.has(voterVoteOption)) {
      throw new Error('Voter vote option is not valid.');
    }

    // we use casting here to remove autocompletion complaint
    // since we know it will be captured by the previous check
    let voteOption = VOTE_OPTIONS.get(voterVoteOption) as string;

    let event = createNewVoteCastEvent(
      this.pluginProposalId.toString(),
      voter,
      voteOption,
      voterVotingPower,
      this.plugin
    );
    return event;
  }

  createEvent_ProposalExecuted(): ProposalExecuted {
    let event = createNewProposalExecutedEvent(
      this.pluginProposalId.toString(),
      this.plugin
    );
    return event;
  }
}

class TokenVotingVoteMethods extends TokenVotingVote {
  // build entity
  // if id not changed it will update
  withDefaultValues(): TokenVotingVoteMethods {
    let voterOptionIndex = 0;
    if (!VOTER_OPTIONS.has(voterOptionIndex)) {
      throw new Error('Voter option is not valid.');
    }

    // we use casting here to remove autocompletion complaint
    // since we know it will be captured by the previous check
    let voterOption = VOTER_OPTIONS.get(voterOptionIndex) as string;

    this.id = ADDRESS_ONE.concat('_').concat(PROPOSAL_ENTITY_ID);
    this.voter = Address.fromHexString(CONTRACT_ADDRESS)
      .toHexString()
      .concat('_')
      .concat(ADDRESS_ONE);
    this.proposal = PROPOSAL_ENTITY_ID;
    this.voteOption = voterOption;
    this.votingPower = BigInt.fromString(TWO);
    this.createdAt = BigInt.fromString(CREATED_AT);
    this.voteReplaced = false;
    this.updatedAt = BigInt.fromString(ZERO);

    return this;
  }
}

class TokenVotingPluginMethods extends TokenVotingPlugin {
  // build entity
  // if id not changed it will update
  withDefaultValues(): TokenVotingPluginMethods {
    let votingModeIndex = parseInt(VOTING_MODE);
    if (!VOTING_MODES.has(votingModeIndex)) {
      throw new Error('voting mode is not valid.');
    }

    // we use casting here to remove autocompletion complaint
    // since we know it will be captured by the previous check
    let votingMode = VOTING_MODES.get(votingModeIndex) as string;
    const pluginAddress = Address.fromString(CONTRACT_ADDRESS);
    const pluginEntityId = generatePluginEntityId(pluginAddress);

    this.id = pluginEntityId;
    this.dao = Bytes.fromHexString(DAO_ADDRESS);
    this.pluginAddress = pluginAddress;
    this.votingMode = votingMode;
    this.supportThreshold = BigInt.fromString(SUPPORT_THRESHOLD);
    this.minParticipation = BigInt.fromString(MIN_PARTICIPATION);
    this.minDuration = BigInt.fromString(MIN_DURATION);
    this.minProposerVotingPower = BigInt.zero();
    this.proposalCount = BigInt.zero();
    this.token = DAO_TOKEN_ADDRESS;

    return this;
  }

  mockCall_getProposalCountCall(): void {
    getProposalCountCall(
      this.pluginAddress.toHexString(),
      this.proposalCount.toString()
    );
  }

  createEvent_VotingSettingsUpdated(): VotingSettingsUpdated {
    if (this.votingMode === null) {
      throw new Error('Voting mode is null.');
    }

    // we cast to string only for stoping rust compiler complaints.
    let votingMode: string = this.votingMode as string;
    if (!VOTING_MODE_INDEXES.has(votingMode)) {
      throw new Error('Voting mode index is not valid.');
    }

    // we use casting here to remove autocompletion complaint
    // since we know it will be captured by the previous check
    let votingModeIndex = VOTING_MODE_INDEXES.get(votingMode) as string;

    let event = createNewVotingSettingsUpdatedEvent(
      votingModeIndex, // for event we need the index of the mapping to simulate the contract event
      (this.supportThreshold as BigInt).toString(),
      (this.minParticipation as BigInt).toString(),
      (this.minDuration as BigInt).toString(),
      (this.minProposerVotingPower as BigInt).toString(),
      this.pluginAddress.toHexString()
    );

    return event;
  }

  createEvent_MembershipContractAnnounced(): MembershipContractAnnounced {
    if (this.token === null) {
      throw new Error('Token is null');
    }
    let event = createNewMembershipContractAnnouncedEvent(
      this.token as string,
      this.pluginAddress.toHexString()
    );

    return event;
  }
}

// TokenVotingMember
class TokenVotingMemberMethods extends TokenVotingMember {
  withDefaultValues(
    memberAddress: string = ADDRESS_ONE,
    pluginAddress: string = CONTRACT_ADDRESS
  ): TokenVotingMemberMethods {
    const plugin = Address.fromBytes(Bytes.fromHexString(pluginAddress));
    const member = Address.fromBytes(Bytes.fromHexString(memberAddress));
    let id = generateMemberEntityId(plugin, member);

    this.id = id;
    this.address = Address.fromHexString(memberAddress);
    this.balance = BigInt.zero();
    this.plugin = plugin.toHexString();
    this.delegatee = null;
    this.votingPower = BigInt.zero();

    return this;
  }

  mockCall_delegatesCall(
    tokenContractAddress: string,
    account: string,
    returns: string
  ): void {
    delegatesCall(tokenContractAddress, account, returns);
  }

  createEvent_DelegateChanged(
    delegator: string = this.address.toHexString(),
    fromDelegate: string = this.address.toHexString(),
    toDelegate: string = this.address.toHexString(),
    tokenContract: string = Address.fromHexString(
      DAO_TOKEN_ADDRESS
    ).toHexString()
  ): DelegateChanged {
    let event = createNewDelegateChangedEvent(
      delegator,
      fromDelegate,
      toDelegate,
      tokenContract
    );

    return event;
  }

  createEvent_DelegateVotesChanged(
    newBalance: string = '0',
    previousBalance: string = '0',
    tokenContract: string = Address.fromHexString(
      DAO_TOKEN_ADDRESS
    ).toHexString()
  ): DelegateVotesChanged {
    let event = createNewDelegateVotesChangedEvent(
      this.address.toHexString(),
      previousBalance,
      newBalance,
      tokenContract
    );

    return event;
  }
}
