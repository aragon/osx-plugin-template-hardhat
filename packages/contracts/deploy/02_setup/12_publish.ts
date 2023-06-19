import {PLUGIN_REPO_NAME} from '../01_repo/10_create_repo';
import buildMetadata from '../../src/build-metadata.json';
import releaseMetadata from '../../src/release-metadata.json';
import {addCreatedVersion, getPluginInfo} from '../../utils/helpers';
import {toHex} from '../../utils/ipfs-upload';
import {uploadToIPFS} from '../../utils/ipfs-upload';
import {NAME} from './10_setup';
import {PluginRepo__factory} from '@aragon/osx-ethers';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

const pluginSetupContractName = 'SimpleStorageSetup';
const releaseNumber = 1;

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, network} = hre;
  const [deployer] = await hre.ethers.getSigners();

  // Upload the metadata
  const releaseMetadataURI = `ipfs://${await uploadToIPFS(
    JSON.stringify(releaseMetadata),
    false
  )}`;
  const buildMetadataURI = `ipfs://${await uploadToIPFS(
    JSON.stringify(buildMetadata),
    false
  )}`;

  console.log(`Uploaded release metadata: ${releaseMetadataURI}`);
  console.log(`Uploaded build metadata: ${buildMetadataURI}`);

  // Get PluginSetup
  const setup = await deployments.get(pluginSetupContractName);

  console.log(network.name);

  // Get PluginRepo
  const pluginRepo = PluginRepo__factory.connect(
    getPluginInfo()[network.name]['address'],
    deployer
  );

  // Create Version
  const tx = await pluginRepo.createVersion(
    releaseNumber,
    setup.address,
    toHex(buildMetadataURI),
    toHex(releaseMetadataURI)
  );

  const blockNumberOfPublication = (await tx.wait()).blockNumber;

  if (setup == undefined || setup?.receipt == undefined) {
    throw Error('setup deployment unavailable');
  }

  const version = await pluginRepo['getLatestVersion(uint8)'](releaseNumber);
  if (releaseNumber !== version.tag.release) {
    throw Error('something went wrong');
  }

  console.log(
    `Published ${pluginSetupContractName} at ${setup.address} in PluginRepo ${PLUGIN_REPO_NAME} at ${pluginRepo.address} at block ${blockNumberOfPublication}.`
  );

  addCreatedVersion(
    network.name,
    {release: releaseNumber, build: version.tag.build},
    {release: releaseMetadataURI, build: buildMetadataURI},
    blockNumberOfPublication,
    {
      name: pluginSetupContractName,
      address: setup.address,
      blockNumberOfDeployment: setup.receipt.blockNumber,
    }
  );
};

export default func;
func.tags = [NAME, 'Publish'];
