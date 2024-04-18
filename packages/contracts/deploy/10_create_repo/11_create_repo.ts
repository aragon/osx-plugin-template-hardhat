import {PLUGIN_REPO_ENS_SUBDOMAIN_NAME} from '../../plugin-settings';
import {
  findPluginRepo,
  getProductionNetworkName,
  pluginEnsDomain,
} from '../../utils/helpers';
import {
  getLatestNetworkDeployment,
  getNetworkNameByAlias,
} from '@aragon/osx-commons-configs';
import {
  UnsupportedNetworkError,
  findEventTopicLog,
} from '@aragon/osx-commons-sdk';
import {
  PluginRepoRegistryEvents,
  PluginRepoRegistry__factory,
  PluginRepo__factory,
  PluginRepoFactory__factory,
} from '@aragon/osx-ethers';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import path from 'path';

/**
 * Creates a plugin repo under Aragon's ENS base domain with subdomain requested in the `./plugin-settings.ts` file.
 * @param {HardhatRuntimeEnvironment} hre
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(
    `Creating the '${pluginEnsDomain(
      hre
    )}' plugin repo through Aragon's 'PluginRepoFactory'...`
  );

  const [deployer] = await hre.ethers.getSigners();

  // Get the Aragon `PluginRepoFactory` from the `osx-commons-configs`
  const productionNetworkName = getProductionNetworkName(hre);
  const network = getNetworkNameByAlias(productionNetworkName);
  if (network === null) {
    throw new UnsupportedNetworkError(productionNetworkName);
  }
  const networkDeployments = getLatestNetworkDeployment(network);
  if (networkDeployments === null) {
    throw `Deployments are not available on network ${network}.`;
  }
  const pluginRepoFactory = PluginRepoFactory__factory.connect(
    networkDeployments.PluginRepoFactory.address,
    deployer
  );

  // Create the `PluginRepo` through the Aragon `PluginRepoFactory`
  const tx = await pluginRepoFactory.createPluginRepo(
    PLUGIN_REPO_ENS_SUBDOMAIN_NAME,
    deployer.address
  );

  // Get the PluginRepo address and deployment block number from the txn and event therein
  const eventLog =
    findEventTopicLog<PluginRepoRegistryEvents.PluginRepoRegisteredEvent>(
      await tx.wait(),
      PluginRepoRegistry__factory.createInterface(),
      'PluginRepoRegistered'
    );

  const pluginRepo = PluginRepo__factory.connect(
    eventLog.args.pluginRepo,
    deployer
  );

  console.log(
    `PluginRepo '${pluginEnsDomain(hre)}' deployed at '${pluginRepo.address}'.`
  );

  hre.aragonToVerifyContracts.push({
    address: pluginRepo.address,
    args: [],
  });
};

export default func;
func.tags = ['CreateRepo'];

/**
 * Skips `PluginRepo` creation if the ENS name is claimed already
 * @param {HardhatRuntimeEnvironment} hre
 */
func.skip = async (hre: HardhatRuntimeEnvironment) => {
  console.log(`\n🏗️  ${path.basename(__filename)}:`);

  // Check if the ens record exists already
  const {pluginRepo, ensDomain} = await findPluginRepo(hre);

  if (pluginRepo !== null) {
    console.log(
      `ENS name '${ensDomain}' was claimed already at '${
        pluginRepo.address
      }' on network '${getProductionNetworkName(hre)}'. Skipping deployment...`
    );

    hre.aragonToVerifyContracts.push({
      address: pluginRepo.address,
      args: [],
    });

    return true;
  } else {
    console.log(`ENS name '${ensDomain}' is unclaimed. Deploying...`);

    return false;
  }
};
