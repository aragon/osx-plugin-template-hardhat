# Notes on subgraph oddities:

Run a set of checks on IDs across the whole schema.

I found:

- TokenVotingVoter.address was the entity ID
- TokenVotingVoter.id says "address" when it is actually an entity ID
- TokenVotingVoter.id shares the same id with TokenVotingMember.id
  - Voter really should be tied to a proposal, not a member

What is failureMap vs allowFailureMap in tokenVotingProposal
