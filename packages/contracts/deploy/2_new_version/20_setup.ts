import {PLUGIN_SETUP_CONTRACT_NAME} from '../../plugin-settings';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import path from 'path';

/**
 * Deploys the pluginSetup contract with the `Plugin` implementation inside
 * @param {HardhatRuntimeEnvironment} hre
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`\n🏗️  ${path.basename(__filename)}:`);
  console.log(`Deploying '${PLUGIN_SETUP_CONTRACT_NAME}'...`);

  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  await deploy(PLUGIN_SETUP_CONTRACT_NAME, {
    from: deployer,
    args: [],
    log: true,
  });
};

export default func;

func.tags = [PLUGIN_SETUP_CONTRACT_NAME, 'NewVersion', 'Deployment'];
