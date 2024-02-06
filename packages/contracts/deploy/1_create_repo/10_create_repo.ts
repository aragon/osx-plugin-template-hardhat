import {
  PLUGIN_REPO_ENS_DOMAIN,
  PLUGIN_REPO_ENS_SUBDOMAIN_NAME,
} from '../../plugin-settings';
import {findPluginRepo, getProductionNetworkName} from '../../utils/helpers';
import {
  getLatestNetworkDeployment,
  getNetworkNameByAlias,
} from '@aragon/osx-commons-configs';
import {findEventTopicLog} from '@aragon/osx-commons-sdk';
import {
  PluginRepoRegistryEvents,
  PluginRepoRegistry__factory,
  PluginRepo__factory,
  PluginRepoFactory__factory,
} from '@aragon/osx-ethers';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import path from 'path';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(
    `Creating the '${PLUGIN_REPO_ENS_SUBDOMAIN_NAME}.plugin.dao.eth' plugin repo through Aragon's 'PluginRepoFactory'...`
  );

  const [deployer] = await hre.ethers.getSigners();
  const productionNetworkName: string = getProductionNetworkName(hre);

  // Get the Aragon `PluginRepoFactory` address from the `osx-commons-configs`
  const pluginRepoFactory = PluginRepoFactory__factory.connect(
    getLatestNetworkDeployment(getNetworkNameByAlias(productionNetworkName)!)!
      .PluginRepoFactory.address,
    deployer
  );

  // Create the `PluginRepo` through the Aragon `PluginRepoFactory`
  const tx = await pluginRepoFactory.createPluginRepo(
    PLUGIN_REPO_ENS_SUBDOMAIN_NAME,
    deployer.address
  );

  // Get the PluginRepo address and deployment block number from the txn and event therein
  const iface = PluginRepoRegistry__factory.createInterface();
  const eventLog =
    await findEventTopicLog<PluginRepoRegistryEvents.PluginRepoRegisteredEvent>(
      tx,
      PluginRepoRegistry__factory.createInterface(),
      iface.events['PluginRepoRegistered(string,address)'].name
    );
  const pluginRepo = PluginRepo__factory.connect(
    eventLog.args.pluginRepo,
    deployer
  );
  const blockNumberOfDeployment = (await tx.wait()).blockNumber;

  console.log(
    `"${PLUGIN_REPO_ENS_SUBDOMAIN_NAME}" PluginRepo deployed at: ${pluginRepo.address} at block ${blockNumberOfDeployment}.`
  );

  hre.aragonToVerifyContracts.push({
    address: pluginRepo.address,
    args: [],
  });
};

export default func;
func.tags = ['CreateRepo'];
func.skip = async (hre: HardhatRuntimeEnvironment) => {
  console.log(`\n🏗️  ${path.basename(__filename)}:`);

  // Check if the ens record exists already
  const pluginRepo = await findPluginRepo(hre, PLUGIN_REPO_ENS_DOMAIN);

  const skip = pluginRepo !== null;

  if (skip) {
    console.log(
      `ENS name '${PLUGIN_REPO_ENS_DOMAIN}' exists already at '${
        pluginRepo.address
      }' on network '${getProductionNetworkName(hre)}'. Skipping deployment...`
    );

    hre.aragonToVerifyContracts.push({
      address: pluginRepo.address,
      args: [],
    });
  } else {
    console.log(
      `ENS name '${PLUGIN_REPO_ENS_DOMAIN}' does not exist. Deploying...`
    );
  }

  return skip;
};
