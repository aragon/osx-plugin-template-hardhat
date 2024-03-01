/// Typechain will sometimes by default link to the wrong version of the contract, when we have name collisions
/// The version specified in src is the factory and contract without the version number.
/// Import as needed in the test files, and use the correct version of the contract.

export {Multisig__factory as Multisig_V1_0_0__factory} from '../../typechain/factories/@aragon/osx-v1.0.0/plugins/governance/multisig/Multisig__factory';
export {Multisig__factory as Multisig_V1_3_0__factory} from '../../typechain/factories/@aragon/osx-v1.3.0/plugins/governance/multisig/Multisig__factory';
export {Multisig__factory} from '../../typechain/factories/src/Multisig__factory';
export {Multisig} from '../../typechain/src/Multisig';
export {IMultisig} from '../../typechain/src/IMultisig';
