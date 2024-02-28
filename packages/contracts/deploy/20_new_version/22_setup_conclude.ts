import {PLUGIN_SETUP_CONTRACT_NAME} from '../../plugin-settings';
import {AdminSetup__factory, Admin__factory} from '../../typechain';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import path from 'path';

/**
 * Concludes the plugin setup and implementation contract deployment by queuing the addresses in the verification array.
 * @param {HardhatRuntimeEnvironment} hre
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`\n🔎 ${path.basename(__filename)}:`);
  console.log(`Concluding '${PLUGIN_SETUP_CONTRACT_NAME}' deployment.`);

  const [deployer] = await hre.ethers.getSigners();
  const {deployments} = hre;

  // Get the plugin setup address
  const setupDeployment = await deployments.get(PLUGIN_SETUP_CONTRACT_NAME);
  const setup = AdminSetup__factory.connect(setupDeployment.address, deployer);
  // Get the plugin implementation address
  const implementation = Admin__factory.connect(
    await setup.implementation(),
    deployer
  );

  // Queue the plugin setup and implementation for verification on the block explorers
  hre.aragonToVerifyContracts.push({
    address: setup.address,
    args: setupDeployment.args,
  });
  hre.aragonToVerifyContracts.push({
    address: implementation.address,
    args: [],
  });
};

export default func;
func.tags = [PLUGIN_SETUP_CONTRACT_NAME, 'NewVersion', 'Verification'];
