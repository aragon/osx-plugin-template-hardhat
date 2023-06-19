/**
 * IMPORTANT: Do not export classes from this file.
 * The classes of this file are meant to be incorporated into the classes of ./extended-schema.ts
 */
import {Address, BigInt, Bytes, ethereum} from '@graphprotocol/graph-ts';

/* eslint-disable  @typescript-eslint/no-unused-vars */

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

    const pluginAddress = Address.fromHexString(CONTRACT_ADDRESS);

    this.id = pluginAddress.toHexString();
    this.dao = DAO_ADDRESS;
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
