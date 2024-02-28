import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import path from 'path';

/**
 * Prints the final deployer wallet balance.
 * @param {HardhatRuntimeEnvironment} hre
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`\n✅ ${path.basename(__filename)}:`);

  const [deployer] = await hre.ethers.getSigners();

  console.log(
    `The balance of account '${
      deployer.address
    }' is now ${hre.ethers.utils.formatEther(await deployer.getBalance())}.`
  );

  console.log(`\nDone! 🎉 \n`);
  console.log(`${'-'.repeat(60)}\n`);
};

export default func;
func.tags = ['Info', 'CreateRepo', 'NewVersion', 'UpgradeRepo'];
