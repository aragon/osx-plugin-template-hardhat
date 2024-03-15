import governanceERC20Artifact from '../../artifacts/src/ERC20/governance/GovernanceERC20.sol/GovernanceERC20.json';
import governanceWrappedERC20Artifact from '../../artifacts/src/ERC20/governance/GovernanceWrappedERC20.sol/GovernanceWrappedERC20.json';
import {
  GOVERNANCE_ERC20_DEPLOY_ARGS,
  GOVERNANCE_WRAPPED_ERC20_DEPLOY_ARGS,
  PLUGIN_SETUP_CONTRACT_NAME,
} from '../../plugin-settings';
import {
  GOVERNANCE_ERC20_CONTRACT_NAME,
  GOVERNANCE_WRAPPED_ERC20_CONTRACT_NAME,
} from '../../plugin-settings';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import path from 'path';

/**
 * Deploys the plugin setup contract with the plugin implementation inside.
 * In the case of the token voting plugin, we also need to deploy the governance ERC20
 * and the wrapped variants.
 * @param {HardhatRuntimeEnvironment} hre
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`\n🏗️  ${path.basename(__filename)}:`);

  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  // Deploy the bases for the TokenVotingSetup
  const governanceERC20DeployResult = await deploy(
    GOVERNANCE_ERC20_CONTRACT_NAME,
    {
      contract: governanceERC20Artifact,
      from: deployer,
      args: GOVERNANCE_ERC20_DEPLOY_ARGS,
      log: true,
    }
  );

  const governanceWrappedERC20DeployResult = await deploy(
    GOVERNANCE_WRAPPED_ERC20_CONTRACT_NAME,
    {
      contract: governanceWrappedERC20Artifact,
      from: deployer,
      args: GOVERNANCE_WRAPPED_ERC20_DEPLOY_ARGS,
      log: true,
    }
  );

  const res = await deploy(PLUGIN_SETUP_CONTRACT_NAME, {
    from: deployer,
    args: [
      governanceERC20DeployResult.address,
      governanceWrappedERC20DeployResult.address,
    ],
    log: true,
  });

  console.log(
    `Deployed '${PLUGIN_SETUP_CONTRACT_NAME}' contract at '${res.address}'`
  );
};

export default func;
func.tags = [PLUGIN_SETUP_CONTRACT_NAME, 'NewVersion', 'Deployment'];
