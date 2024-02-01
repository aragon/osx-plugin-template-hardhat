import {
  METADATA,
  PLUGIN_CONTRACT_NAME,
  PLUGIN_REPO_ENS_NAME,
  PLUGIN_SETUP_CONTRACT_NAME,
  VERSION,
} from '../../plugin-settings';
import {addCreatedVersion, getAragonDeploymentsInfo} from '../../utils/helpers';
import {
  PLUGIN_REPO_PERMISSIONS,
  toHex,
  uploadToIPFS,
} from '@aragon/osx-commons-sdk';
import {PluginRepo__factory, PluginSetup__factory} from '@aragon/osx-ethers';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import path from 'path';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(
    `Publishing ${PLUGIN_SETUP_CONTRACT_NAME} as v${VERSION.release}.${VERSION.build} in the "${PLUGIN_REPO_ENS_NAME}" plugin repo`
  );

  const {deployments} = hre;
  const [deployer] = await hre.ethers.getSigners();

  // Upload the metadata to IPFS
  const releaseMetadataURI = `ipfs://${await uploadToIPFS(
    JSON.stringify(METADATA.release, null, 2)
  )}`;
  const buildMetadataURI = `ipfs://${await uploadToIPFS(
    JSON.stringify(METADATA.build, null, 2)
  )}`;

  console.log(`Uploaded release metadata: ${releaseMetadataURI}`);
  console.log(`Uploaded build metadata: ${buildMetadataURI}`);

  // Get PluginSetup
  const setup = await deployments.get(PLUGIN_SETUP_CONTRACT_NAME);

  // Get PluginRepo
  const pluginRepo = PluginRepo__factory.connect(
    getAragonDeploymentsInfo(hre.network.name)[hre.network.name].address,
    deployer
  );

  // Check release number
  const latestRelease = await pluginRepo.latestRelease();
  if (VERSION.release > latestRelease + 1) {
    throw Error(
      `Publishing with release number ${VERSION.release} is not possible. 
        The latest release is ${latestRelease} and the next release you can publish is release number ${
        latestRelease + 1
      }.`
    );
  }

  // Check build number
  const latestBuild = (await pluginRepo.buildCount(VERSION.release)).toNumber();
  if (VERSION.build < latestBuild) {
    throw Error(
      `Publishing with build number ${VERSION.build} is not possible. The latest build is ${latestBuild}. Aborting publication...`
    );
  }
  if (VERSION.build > latestBuild + 1) {
    throw Error(
      `Publishing with build number ${VERSION.build} is not possible. 
        The latest build is ${latestBuild} and the next release you can publish is release number ${
        latestBuild + 1
      }. Aborting publication...`
    );
  }

  // Create Version
  let tx;
  if (
    await pluginRepo.callStatic.isGranted(
      pluginRepo.address,
      deployer.address,
      PLUGIN_REPO_PERMISSIONS.MAINTAINER_PERMISSION_ID,
      '0x00' // TODO
    )
  ) {
    tx = await pluginRepo.createVersion(
      VERSION.release,
      setup.address,
      toHex(buildMetadataURI),
      toHex(releaseMetadataURI)
    );

    const blockNumberOfPublication = (await tx.wait()).blockNumber;

    if (setup == undefined || setup?.receipt == undefined) {
      throw Error('setup deployment unavailable');
    }

    const version = await pluginRepo['getLatestVersion(uint8)'](
      VERSION.release
    );
    if (VERSION.release !== version.tag.release) {
      throw Error('something went wrong');
    }

    const implementationAddress = await PluginSetup__factory.connect(
      setup.address,
      deployer
    ).implementation();

    console.log(
      `Published ${PLUGIN_SETUP_CONTRACT_NAME} at ${setup.address} in PluginRepo ${PLUGIN_REPO_ENS_NAME} at ${pluginRepo.address} at block ${blockNumberOfPublication}.`
    );

    addCreatedVersion(
      hre.network.name,
      {release: VERSION.release, build: version.tag.build},
      {release: releaseMetadataURI, build: buildMetadataURI},
      blockNumberOfPublication,
      {
        name: PLUGIN_SETUP_CONTRACT_NAME,
        address: setup.address,
        args: [],
        blockNumberOfDeployment: setup.receipt.blockNumber,
      },
      {
        name: PLUGIN_CONTRACT_NAME,
        address: implementationAddress,
        args: [],
        blockNumberOfDeployment: setup.receipt.blockNumber,
      },
      []
    );
  } else {
    throw Error(
      `The new version cannot be published because the deployer ('${deployer.address}') is lacking the ${PLUGIN_REPO_PERMISSIONS.MAINTAINER_PERMISSION_ID} permission on repo (${pluginRepo.address}).`
    );
  }
};

export default func;
func.tags = [PLUGIN_SETUP_CONTRACT_NAME, 'NewVersion', 'Publication'];
func.skip = async (hre: HardhatRuntimeEnvironment) => {
  console.log(`\n📢 ${path.basename(__filename)}:`);

  const [deployer] = await hre.ethers.getSigners();
  const network: string = hre.network.name;

  // Get PluginRepo
  const pluginRepo = PluginRepo__factory.connect(
    getAragonDeploymentsInfo(network)[network]['address'],
    deployer
  );

  // Check build number
  const latestBuild = (await pluginRepo.buildCount(VERSION.release)).toNumber();

  if (VERSION.build === latestBuild) {
    console.log(
      `Build number ${VERSION.build} has already been published for release ${VERSION.release}. Skipping publication...`
    );
    return true;
  }

  return false;
};
