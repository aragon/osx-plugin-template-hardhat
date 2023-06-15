import {
  networkNameMapping,
  osxContracts,
  findEventTopicLog,
  addDeployedContract,
} from '../../utils/helpers';
import {
  PluginRepoFactory__factory,
  PluginRepoRegistry__factory,
  PluginRepo__factory,
} from '@aragon/osx-ethers';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, network} = hre;
  const [deployer] = await hre.ethers.getSigners();

  // Get the plugin factory address
  let pluginRepoFactoryAddr: string;
  if (
    network.name === 'localhost' ||
    network.name === 'hardhat' ||
    network.name === 'coverage'
  ) {
    const hardhatForkNetwork = process.env.HARDHAT_FORK_NETWORK
      ? process.env.HARDHAT_FORK_NETWORK
      : 'mainnet';

    pluginRepoFactoryAddr = osxContracts[hardhatForkNetwork].PluginRepoFactory;
    console.log(
      `Using the ${hardhatForkNetwork} PluginRepoFactory address (${pluginRepoFactoryAddr}) for deployment testing on network ${network.name}`
    );
  } else {
    pluginRepoFactoryAddr =
      osxContracts[networkNameMapping[network.name]].PluginRepoFactory;

    console.log(
      `Using the ${
        networkNameMapping[network.name]
      } PluginRepoFactory address (${pluginRepoFactoryAddr}) for deployment...`
    );
  }

  const pluginRepoFactory = PluginRepoFactory__factory.connect(
    pluginRepoFactoryAddr,
    deployer
  );

  const pluginName = 'test-repo-123';

  // Create Repo
  const tx = await pluginRepoFactory.createPluginRepo(
    pluginName,
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

  console.log(`"${pluginName}" PluginRepo deployed at: ${pluginRepo.address}`);

  addDeployedContract(
    network.name,
    'PluginRepo'.concat('_').concat(pluginName),
    pluginRepo.address
  );
};

export default func;
func.tags = ['PluginRepo'];
