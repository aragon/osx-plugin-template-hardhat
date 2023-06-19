import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

export const NAME = 'SimpleStorageSetup';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`${NAME}`);

  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;
  const {deployer} = await getNamedAccounts();

  await deploy(NAME, {
    from: deployer,
    args: [],
    log: true,
  });
};

export default func;
func.tags = [NAME];
