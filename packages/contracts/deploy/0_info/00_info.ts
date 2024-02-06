import {
  AragonOSxAsciiArt,
  getProductionNetworkName,
  isLocal,
} from '../../utils/helpers';
import {getNetworkByNameOrAlias} from '@aragon/osx-commons-configs';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import path from 'path';

/**
 * Prints the plugin setup and implementation contract deployment by queuing the addresses in the verification array.
 * @param {HardhatRuntimeEnvironment} hre
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(AragonOSxAsciiArt);
  console.log(`${'-'.repeat(60)}`);
  console.log(`\n✨ ${path.basename(__filename)}:`);

  const [deployer] = await hre.ethers.getSigners();

  if (isLocal(hre)) {
    const productionNetworkName: string = getProductionNetworkName(hre);

    console.log(
      `Simulated deployment on local network '${hre.network.name}'. Forking production network '${productionNetworkName}'...`
    );

    // Fork the network provided in the `.env` file
    const networkConfig = getNetworkByNameOrAlias(productionNetworkName)!;
    await hre.network.provider.request({
      method: 'hardhat_reset',
      params: [
        {
          forking: {
            jsonRpcUrl: networkConfig.url,
          },
        },
      ],
    });
  } else {
    console.log(`Production deployment on network '${hre.network.name}'.`);
  }

  console.log(
    `Using account "${
      deployer.address
    }" with a balance of ${hre.ethers.utils.formatEther(
      await deployer.getBalance()
    )} native tokens.`
  );
};

export default func;
func.tags = ['Info', 'CreateRepo', 'NewVersion', 'UpgradeRepo'];
