import {PLUGIN_REPO_ENS_NAME} from '../../plugin-settings';
import {
  getProductionNetworkName,
  getAragonDeploymentsInfo,
} from '../../utils/helpers';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import path from 'path';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`\n🔎  ${path.basename(__filename)}:`);
  console.log(
    `Concluding creation of plugin repo '${PLUGIN_REPO_ENS_NAME}.plugin.dao.eth'.`
  );

  const productionNetworkName: string = getProductionNetworkName(hre);

  // Get the `PluginRepo` from the Aragon deployments file
  const pluginRepoAddr = getAragonDeploymentsInfo(productionNetworkName)[
    productionNetworkName
  ].addres;

  hre.aragonToVerifyContracts.push({
    address: pluginRepoAddr,
    args: [],
  });
};

export default func;
func.tags = ['CreateRepo', 'Verification'];
