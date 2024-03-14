import {VotingMode, VotingSettings} from './voting-helpers';
import {TIME, pctToRatio} from '@aragon/osx-commons-sdk';
import {ethers} from 'hardhat';
import {Address} from 'hardhat-deploy/types';

export const TOKEN_VOTING_INTERFACE = new ethers.utils.Interface([
  'function initialize(address,tuple(uint8,uint32,uint32,uint64,uint256),address)',
  'function getVotingToken()',
]);
export const TOKEN_VOTING_INTERFACE_ID = '0x50eb001e';

export const DEFAULT_VOTING_SETTINGS: VotingSettings = {
  votingMode: VotingMode.EarlyExecution,
  supportThreshold: pctToRatio(50),
  minParticipation: pctToRatio(20),
  minDuration: TIME.HOUR,
  minProposerVotingPower: 0,
};

export type TokenVotingSettings = {
  dao: Address;
  votingSettings: VotingSettings;
  token: Address;
};

export const spreadSettings = (
  settings: TokenVotingSettings
): [Address, VotingSettings, Address] => [
  settings.dao,
  settings.votingSettings,
  settings.token,
];
