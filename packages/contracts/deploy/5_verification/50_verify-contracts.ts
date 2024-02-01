import {verifyContract} from '../../utils/etherscan';
import {isLocal} from '../../utils/helpers';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import path from 'path';

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log('\nVerifying contracts');

  for (let index = 0; index < hre.aragonToVerifyContracts.length; index++) {
    const element = hre.aragonToVerifyContracts[index];

    console.log(
      `Verifying address ${element.address} with constructor argument ${element.args}.`
    );
    await verifyContract(element.address, element.args || []);

    // Etherscan Max rate limit is 1/5s,
    // use 6s just to be safe.
    console.log(
      `Delaying 6s, so we dont reach Etherscan's Max rate limit of 1/5s.`
    );
    await delay(6000);
  }

  console.log(`\n${'-'.repeat(60)}\n`);
};

export default func;

func.tags = ['Verification'];
func.runAtTheEnd = true;
func.skip = async (hre: HardhatRuntimeEnvironment) => {
  console.log(`\n📋 ${path.basename(__filename)}:`);

  const local = isLocal(hre);

  if (local) {
    console.log(
      `Skipping verification for local network ${hre.network.name}...`
    );
  } else {
    console.log(`Starting verification on network ${hre.network.name}...`);
  }

  return local;
};
