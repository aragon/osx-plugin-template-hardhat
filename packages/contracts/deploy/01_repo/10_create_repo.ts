import {PLUGIN_REPO_ENS_NAME} from '../../plugin-settings';
import {
  networkNameMapping,
  osxContracts,
  findEventTopicLog,
  addDeployedRepo as addCreatedRepo,
} from '../../utils/helpers';
import {
  PluginRepoFactory__factory,
  PluginRepoRegistry__factory,
  PluginRepo__factory,
} from '@aragon/osx-ethers';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(`\nDeploying the "${PLUGIN_REPO_ENS_NAME}" plugin repo`);

  const {network} = hre;
  const [deployer] = await hre.ethers.getSigners();

  // Get the PluginRepoFactory address
  let pluginRepoFactoryAddr: string = getPluginRepoFactoryAddress(network.name);

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
    blockNumberOfDeployment
  );
};

export default func;
func.tags = ['PluginRepo', 'Deployment'];

function getPluginRepoFactoryAddress(networkName: string) {
  let pluginRepoFactoryAddr: string;

  if (
    networkName === 'localhost' ||
    networkName === 'hardhat' ||
    networkName === 'coverage'
  ) {
    const hardhatForkNetwork = process.env.NETWORK_NAME
      ? process.env.NETWORK_NAME
      : 'mainnet';

    pluginRepoFactoryAddr = osxContracts[hardhatForkNetwork].PluginRepoFactory;
    console.log(
      `Using the "${hardhatForkNetwork}" PluginRepoFactory address (${pluginRepoFactoryAddr}) for deployment testing on network "${networkName}"`
    );
  } else {
    pluginRepoFactoryAddr =
      osxContracts[networkNameMapping[networkName]].PluginRepoFactory;

    console.log(
      `Using the ${networkNameMapping[networkName]} PluginRepoFactory address (${pluginRepoFactoryAddr}) for deployment...`
    );
  }
  return pluginRepoFactoryAddr;
}
