import {PLUGIN_SETUP_CONTRACT_NAME} from '../../plugin-settings';
import {
  SimpleStorageSetup__factory,
  SimpleStorage__factory,
} from '../../typechain';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {setTimeout} from 'timers/promises';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Concluding ${PLUGIN_SETUP_CONTRACT_NAME} deployment.\n`);
  const [deployer] = await hre.ethers.getSigners();

  const {deployments, network} = hre;

  const setupDeployment = await deployments.get(PLUGIN_SETUP_CONTRACT_NAME);
  const setup = SimpleStorageSetup__factory.connect(
    setupDeployment.address,
    deployer
  );
  const implementation = SimpleStorage__factory.connect(
    await setup.implementation(),
    deployer
  );

  // Add a timeout for polygon because the call to `implementation()` can fail for newly deployed contracts in the first few seconds
  if (network.name === 'polygon') {
    console.log(`Waiting 30secs for ${network.name} to finish up...`);
    await setTimeout(30000);
  }

  hre.aragonToVerifyContracts.push({
    address: setupDeployment.address,
    args: setupDeployment.args,
  });
  hre.aragonToVerifyContracts.push({
    address: implementation.address,
    args: [],
  });
};

export default func;
func.tags = [PLUGIN_SETUP_CONTRACT_NAME, 'Verification'];
