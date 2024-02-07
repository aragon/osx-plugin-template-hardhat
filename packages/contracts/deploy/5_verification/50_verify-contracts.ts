import {verifyContract} from '../../utils/etherscan';
import {isLocal} from '../../utils/helpers';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import path from 'path';

/**
 * Verifies the deployed contracts on the network's block explorer.
 * @param {HardhatRuntimeEnvironment} hre
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  hre.aragonToVerifyContracts.forEach(async contract => {
    console.log(
      `Verifying address ${contract.address} with constructor argument ${contract.args}.`
    );
    await verifyContract(contract.address, contract.args || []);

    // Etherscan Max rate limit is 1/5s,
    // Wait 6s just to be safe.
    console.log(
      `Delaying 6s, so we don't reach Etherscan's Max rate limit of 1/5s.`
    );
    await new Promise(resolve => setTimeout(resolve, 6000));
  });

  console.log(`\n${'-'.repeat(60)}\n`);
};

export default func;

func.tags = ['Verification'];
func.runAtTheEnd = true;

/**
 * Skips verification for local networks.
 * @param {HardhatRuntimeEnvironment} hre
 */
func.skip = async (hre: HardhatRuntimeEnvironment) => {
  console.log(`\n📋 ${path.basename(__filename)}:`);

  if (isLocal(hre)) {
    console.log(
      `Skipping verification for local network ${hre.network.name}...`
    );
    return true;
  } else {
    console.log(`Starting verification on network ${hre.network.name}...`);
    return false;
  }
};
