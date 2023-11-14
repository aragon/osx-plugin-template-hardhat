import {PLUGIN_REPO_ENS_NAME} from '../../plugin-settings';
import {ENS__factory} from '../../typechain';
import {
  findEventTopicLog,
  addDeployedRepo as addCreatedRepo,
  getPluginRepoFactoryAddress,
  getPluginRepoRegistryAddress,
} from '../../utils/helpers';
import {
  PluginRepoFactory__factory,
  PluginRepoRegistry__factory,
  PluginRepo__factory,
  ENSSubdomainRegistrar__factory,
} from '@aragon/osx-ethers';
import {ethers} from 'hardhat';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`\nDeploying the "${PLUGIN_REPO_ENS_NAME}" plugin repo`);

  const {network} = hre;
  const [deployer] = await hre.ethers.getSigners();

  // Get the PluginRepoFactory address
  const pluginRepoFactoryAddr: string = getPluginRepoFactoryAddress(
    network.name
  );

  const pluginRepoFactory = PluginRepoFactory__factory.connect(
    pluginRepoFactoryAddr,
    deployer
  );

  // Create the PluginRepo
  const tx = await pluginRepoFactory.createPluginRepo(
    PLUGIN_REPO_ENS_NAME,
    deployer.address
  );

  const eventLog = await findEventTopicLog(
    tx,
    PluginRepoRegistry__factory.createInterface(),
    'PluginRepoRegistered'
  );
  if (!eventLog) {
    throw new Error('Failed to get PluginRepoRegistered event log');
  }

  const pluginRepo = PluginRepo__factory.connect(
    eventLog.args.pluginRepo,
    deployer
  );

  const blockNumberOfDeployment = (await tx.wait()).blockNumber;

  console.log(
    `"${PLUGIN_REPO_ENS_NAME}" PluginRepo deployed at: ${pluginRepo.address} at block ${blockNumberOfDeployment}.`
  );

  // Store the information
  addCreatedRepo(
    network.name,
    PLUGIN_REPO_ENS_NAME,
    pluginRepo.address,
    [],
    blockNumberOfDeployment
  );
};

export default func;
func.tags = ['PluginRepo', 'Deployment'];
func.skip = async (hre: HardhatRuntimeEnvironment) => {
  // Skip plugin repo creation if the ENS name is taken already

  const [deployer] = await hre.ethers.getSigners();

  const pluginRepoRegistry = PluginRepoRegistry__factory.connect(
    getPluginRepoRegistryAddress(hre.network.name),
    deployer
  );

  const registrar = ENSSubdomainRegistrar__factory.connect(
    await pluginRepoRegistry.subdomainRegistrar(),
    deployer
  );

  const ens = ENS__factory.connect(await registrar.ens(), deployer);

  const recordExists = await ens.recordExists(
    ethers.utils.namehash(`${PLUGIN_REPO_ENS_NAME}.plugin.dao.eth`)
  );

  console.log(
    `ENS name ${PLUGIN_REPO_ENS_NAME}.plugin.dao.eth does ${
      recordExists ? 'exist already' : 'not exist yet'
    }`
  );

  return recordExists;
};
