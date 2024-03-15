import {PLUGIN_SETUP_CONTRACT_NAME} from '../../plugin-settings';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import path from 'path';

/**
 * Deploys the plugin setup contract with the plugin implementation inside.
 * @param {HardhatRuntimeEnvironment} hre
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`\n🏗️  ${path.basename(__filename)}:`);

  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  const res = await deploy(PLUGIN_SETUP_CONTRACT_NAME, {
    from: deployer,
    args: [],
    log: true,
  });

  console.log(
    `Deployed '${PLUGIN_SETUP_CONTRACT_NAME}' contract at '${res.address}'`
  );
};

export default func;
func.tags = [PLUGIN_SETUP_CONTRACT_NAME, 'NewVersion', 'Deployment'];
