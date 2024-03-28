import {PLUGIN_REPO_ENS_SUBDOMAIN_NAME} from '../../plugin-settings';
import {
  AragonOSxAsciiArt,
  getProductionNetworkName,
  isLocal,
} from '../../utils/helpers';
import {getNetworkByNameOrAlias} from '@aragon/osx-commons-configs';
import {UnsupportedNetworkError} from '@aragon/osx-commons-sdk';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import path from 'path';

/**
 * Prints information about the used/forked network and initial deployer wallet balance.
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
    const networkConfig = getNetworkByNameOrAlias(productionNetworkName);
    if (networkConfig === null) {
      throw new UnsupportedNetworkError(productionNetworkName);
    }
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
    `Using account '${
      deployer.address
    }' with a balance of ${hre.ethers.utils.formatEther(
      await deployer.getBalance()
    )} native tokens.`
  );

  console.log(
    `Chosen PluginRepo ENS subdomain name: '${PLUGIN_REPO_ENS_SUBDOMAIN_NAME}'`
  );
};

export default func;
func.tags = ['Info', 'CreateRepo', 'NewVersion', 'UpgradeRepo'];
