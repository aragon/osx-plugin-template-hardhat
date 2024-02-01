import {PLUGIN_REPO_ENS_NAME} from '../../plugin-settings';
import {ENS__factory} from '../../typechain';
import {PluginRepoRegisteredEvent} from '../../typechain/@aragon/osx/framework/plugin/repo/PluginRepoRegistry';
import {addDeployedRepo, getProductionNetworkName} from '../../utils/helpers';
import {
  getLatestNetworkDeployment,
  getNetworkNameByAlias,
} from '@aragon/osx-commons-configs';
import {findEventTopicLog} from '@aragon/osx-commons-sdk';
import {
  PluginRepoRegistry__factory,
  PluginRepo__factory,
  ENSSubdomainRegistrar__factory,
  PluginRepoFactory__factory,
} from '@aragon/osx-ethers';
import {Contract} from 'ethers';
import {ethers} from 'hardhat';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import path from 'path';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(
    `Creating the '${PLUGIN_REPO_ENS_NAME}.plugin.dao.eth' plugin repo through Aragon's 'PluginRepoFactory'...`
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
    PLUGIN_REPO_ENS_NAME,
    deployer.address
  );

  // Get the PluginRepo address and deployment block number from the txn and event therein
  const iface = PluginRepoRegistry__factory.createInterface();
  const eventLog = await findEventTopicLog<PluginRepoRegisteredEvent>(
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
    `"${PLUGIN_REPO_ENS_NAME}" PluginRepo deployed at: ${pluginRepo.address} at block ${blockNumberOfDeployment}.`
  );

  // Store the information
  addDeployedRepo(
    hre.network.name,
    PLUGIN_REPO_ENS_NAME,
    pluginRepo.address,
    [PLUGIN_REPO_ENS_NAME, deployer.address],
    blockNumberOfDeployment
  );
};

export default func;
func.tags = ['CreateRepo'];
func.skip = async (hre: HardhatRuntimeEnvironment) => {
  console.log(`\n🏗️  ${path.basename(__filename)}:`);

  const [deployer] = await hre.ethers.getSigners();
  const productionNetworkName: string = getProductionNetworkName(hre);

  const registrar = ENSSubdomainRegistrar__factory.connect(
    getLatestNetworkDeployment(getNetworkNameByAlias(productionNetworkName)!)!
      .PluginENSSubdomainRegistrarProxy.address,
    deployer
  );

  // Check if the ens record exists already
  const ens = ENS__factory.connect(await registrar.ens(), deployer);
  const node = ethers.utils.namehash(`${PLUGIN_REPO_ENS_NAME}.plugin.dao.eth`);
  const recordExists = await ens.recordExists(node);

  if (recordExists) {
    const resolverAddr = await ens.resolver(node);
    const resolver = new Contract(
      resolverAddr,
      ['function addr(bytes32 node) external view returns (address payable)'],
      deployer
    );
    const repoAddr = await resolver.addr(node);

    console.log(
      `ENS name '${PLUGIN_REPO_ENS_NAME}.plugin.dao.eth' exists already at '${repoAddr}' on network '${productionNetworkName}'. Skipping deployment...`
    );
  } else {
    console.log(
      `ENS name '${PLUGIN_REPO_ENS_NAME}.plugin.dao.eth' does not exist. Deploying...`
    );
  }

  return recordExists;
};
