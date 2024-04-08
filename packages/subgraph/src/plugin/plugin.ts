import {
  Action,
  MultisigPlugin,
  MultisigProposal,
  MultisigApprover,
  MultisigProposalApprover,
} from '../../generated/schema';
import {
  ProposalCreated,
  ProposalExecuted,
  MembersAdded,
  MembersRemoved,
  Plugin,
  Approved,
  MultisigSettingsUpdated,
} from '../../generated/templates/Plugin/Plugin';
import {generateMemberEntityId, generateVoterEntityId} from './id';
import {
  generateActionEntityId,
  generatePluginEntityId,
  generateProposalEntityId,
} from '@aragon/osx-commons-subgraph';
import {Address, dataSource, store} from '@graphprotocol/graph-ts';

export function handleProposalCreated(event: ProposalCreated): void {
  const context = dataSource.context();
  const daoAddressString = context.getString('daoAddress');
  const daoAddress = Address.fromString(daoAddressString);
  const metadata = event.params.metadata.toString();
  _handleProposalCreated(event, daoAddress, metadata);
}

export function _handleProposalCreated(
  event: ProposalCreated,
  daoAddress: Address,
  metadata: string
): void {
  const pluginProposalId = event.params.proposalId;
  const pluginAddress = event.address;
  const proposalEntityId = generateProposalEntityId(
    pluginAddress,
    pluginProposalId
  );
  const pluginEntityId = generatePluginEntityId(pluginAddress);

  const proposalEntity = new MultisigProposal(proposalEntityId);

  proposalEntity.daoAddress = daoAddress;
  proposalEntity.plugin = pluginEntityId;
  proposalEntity.pluginProposalId = pluginProposalId;
  proposalEntity.creator = event.params.creator;
  proposalEntity.metadata = metadata;
  proposalEntity.createdAt = event.block.timestamp;
  proposalEntity.creationBlockNumber = event.block.number;
  proposalEntity.startDate = event.params.startDate;
  proposalEntity.endDate = event.params.endDate;
  proposalEntity.allowFailureMap = event.params.allowFailureMap;

  const contract = Plugin.bind(pluginAddress);

  const proposal = contract.try_getProposal(pluginProposalId);
  if (!proposal.reverted) {
    proposalEntity.executed = proposal.value.value0;
    proposalEntity.approvals = proposal.value.value1;

    // ProposalParameters
    const parameters = proposal.value.value2;
    proposalEntity.minApprovals = parameters.minApprovals;
    proposalEntity.snapshotBlock = parameters.snapshotBlock;
    proposalEntity.approvalReached = false;

    // Actions
    const actions = proposal.value.value3;
    for (let index = 0; index < actions.length; index++) {
      const action = actions[index];

      const actionId = generateActionEntityId(
        pluginAddress,
        daoAddress,
        pluginProposalId.toString(),
        index
      );

      const actionEntity = new Action(actionId);
      actionEntity.to = action.to;
      actionEntity.value = action.value;
      actionEntity.data = action.data;
      actionEntity.daoAddress = daoAddress;
      actionEntity.proposal = proposalEntityId;
      actionEntity.save();
    }
    proposalEntity.isSignaling = actions.length == 0;
  }

  proposalEntity.save();

  // update vote length
  const pluginEntity = MultisigPlugin.load(pluginEntityId);
  if (pluginEntity) {
    const voteLength = contract.try_proposalCount();
    if (!voteLength.reverted) {
      pluginEntity.proposalCount = voteLength.value;
      pluginEntity.save();
    }
  }
}

export function handleApproved(event: Approved): void {
  const memberAddress = event.params.approver;
  const pluginAddress = event.address;
  const memberEntityId = generateMemberEntityId(pluginAddress, memberAddress);
  const pluginProposalId = event.params.proposalId;
  const proposalEntityId = generateProposalEntityId(
    event.address,
    pluginProposalId
  );
  const approverProposalId = generateVoterEntityId(
    memberEntityId,
    proposalEntityId
  );

  let approverProposalEntity =
    MultisigProposalApprover.load(approverProposalId);
  if (!approverProposalEntity) {
    approverProposalEntity = new MultisigProposalApprover(approverProposalId);
    approverProposalEntity.approver = memberEntityId;
    approverProposalEntity.proposal = proposalEntityId;
  }
  approverProposalEntity.createdAt = event.block.timestamp;
  approverProposalEntity.save();

  // update count
  const proposalEntity = MultisigProposal.load(proposalEntityId);
  if (proposalEntity) {
    const contract = Plugin.bind(pluginAddress);
    const proposal = contract.try_getProposal(pluginProposalId);

    if (!proposal.reverted) {
      const approvals = proposal.value.value1;
      proposalEntity.approvals = approvals;

      // calculate if proposal is executable
      const minApprovalsStruct = proposal.value.value2;

      if (
        approvals >= minApprovalsStruct.minApprovals &&
        !proposalEntity.approvalReached
      ) {
        proposalEntity.approvalReached = true;
      }

      proposalEntity.save();
    }
  }
}

export function handleProposalExecuted(event: ProposalExecuted): void {
  const pluginProposalId = event.params.proposalId;
  const proposalEntityId = generateProposalEntityId(
    event.address,
    pluginProposalId
  );

  const proposalEntity = MultisigProposal.load(proposalEntityId);
  if (proposalEntity) {
    proposalEntity.approvalReached = false;
    proposalEntity.executed = true;
    proposalEntity.executionDate = event.block.timestamp;
    proposalEntity.executionBlockNumber = event.block.number;
    proposalEntity.executionTxHash = event.transaction.hash;
    proposalEntity.save();
  }
}

export function handleMembersAdded(event: MembersAdded): void {
  const memberAddresses = event.params.members;
  for (let index = 0; index < memberAddresses.length; index++) {
    const pluginEntityId = generatePluginEntityId(event.address);
    const memberEntityId = generateMemberEntityId(
      event.address,
      memberAddresses[index]
    );

    let approverEntity = MultisigApprover.load(memberEntityId);
    if (!approverEntity) {
      approverEntity = new MultisigApprover(memberEntityId);
      approverEntity.address = memberAddresses[index].toHexString();
      approverEntity.plugin = pluginEntityId;
      approverEntity.save();
    }
  }
}

export function handleMembersRemoved(event: MembersRemoved): void {
  const memberAddresses = event.params.members;
  for (let index = 0; index < memberAddresses.length; index++) {
    const memberEntityId = generateMemberEntityId(
      event.address,
      memberAddresses[index]
    );

    const approverEntity = MultisigApprover.load(memberEntityId);
    if (approverEntity) {
      store.remove('MultisigApprover', memberEntityId);
    }
  }
}

export function handleMultisigSettingsUpdated(
  event: MultisigSettingsUpdated
): void {
  const pluginEntity = MultisigPlugin.load(
    generatePluginEntityId(event.address)
  );
  if (pluginEntity) {
    pluginEntity.onlyListed = event.params.onlyListed;
    pluginEntity.minApprovals = event.params.minApprovals;
    pluginEntity.save();
  }
}
