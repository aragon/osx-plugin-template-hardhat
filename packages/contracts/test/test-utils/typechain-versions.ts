/// Typechain will sometimes by default link to the wrong version of the contract, when we have name collisions
/// The version specified in src is the factory and contract without the version number.
/// Import as needed in the test files, and use the correct version of the contract.

/* TokenVoting */
export {TokenVoting__factory as TokenVoting_V1_0_0__factory} from '../../typechain/factories/@aragon/osx-v1.0.0/plugins/governance/majority-voting/token/TokenVoting__factory';
export {TokenVoting__factory as TokenVoting_V1_3_0__factory} from '../../typechain/factories/@aragon/osx-v1.3.0/plugins/governance/majority-voting/token/TokenVoting__factory';
export {TokenVoting__factory} from '../../typechain/factories/src/TokenVoting__factory';
export {TokenVoting} from '../../typechain/src/TokenVoting';

/* TokenVotingSetup */
export {TokenVotingSetup__factory} from '../../typechain';
export {TokenVotingSetup} from '../../typechain';

/* Governance ERC20 */
export {GovernanceERC20__factory as GovernanceERC20_V1_0_0__factory} from '../../typechain/factories/@aragon/osx-v1.0.0/token/ERC20/governance/GovernanceERC20__factory';
export {GovernanceERC20__factory as GovernanceERC20_V1_3_0__factory} from '../../typechain/factories/@aragon/osx-v1.3.0/token/ERC20/governance/GovernanceERC20__factory';
export {GovernanceERC20__factory} from '../../typechain/factories/src/ERC20/governance/GovernanceERC20__factory';
export {GovernanceERC20} from '../../typechain/src/ERC20/governance/GovernanceERC20';

/* Governance Wrapped ERC20 */
export {GovernanceWrappedERC20__factory as GovernanceWrappedERC20_V1_0_0__factory} from '../../typechain/factories/@aragon/osx-v1.0.0/token/ERC20/governance/GovernanceWrappedERC20__factory';
export {GovernanceWrappedERC20__factory as GovernanceWrappedERC20_V1_3_0__factory} from '../../typechain/factories/@aragon/osx-v1.3.0/token/ERC20/governance/GovernanceWrappedERC20__factory';
export {GovernanceWrappedERC20__factory} from '../../typechain/factories/src/ERC20/governance/GovernanceWrappedERC20__factory';
export {GovernanceWrappedERC20} from '../../typechain/src/ERC20/governance/GovernanceWrappedERC20';
