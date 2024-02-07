import {
  METADATA,
  PLUGIN_REPO_ENS_SUBDOMAIN_NAME,
  PLUGIN_SETUP_CONTRACT_NAME,
  VERSION,
} from '../../plugin-settings';
import {
  findPluginRepo,
  getPastVersionCreatedEvents,
  pluginEnsDomain,
} from '../../utils/helpers';
import {
  PLUGIN_REPO_PERMISSIONS,
  toHex,
  uploadToIPFS,
} from '@aragon/osx-commons-sdk';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import path from 'path';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  console.log(
    `Publishing ${PLUGIN_SETUP_CONTRACT_NAME} as v${VERSION.release}.${VERSION.build} in the "${PLUGIN_REPO_ENS_SUBDOMAIN_NAME}" plugin repo`
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
  const {pluginRepo, ensDomain} = await findPluginRepo(hre);
  if (pluginRepo === null) {
    throw `PluginRepo '${ensDomain}' does not exist yet.`;
  }

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
  if (
    await pluginRepo.callStatic.isGranted(
      pluginRepo.address,
      deployer.address,
      PLUGIN_REPO_PERMISSIONS.MAINTAINER_PERMISSION_ID,
      []
    )
  ) {
    const tx = await pluginRepo.createVersion(
      VERSION.release,
      setup.address,
      toHex(buildMetadataURI),
      toHex(releaseMetadataURI)
    );

    if (setup == undefined || setup?.receipt == undefined) {
      throw Error('setup deployment unavailable');
    }

    await tx.wait();

    const version = await pluginRepo['getLatestVersion(uint8)'](
      VERSION.release
    );
    if (VERSION.release !== version.tag.release) {
      throw Error('something went wrong');
    }

    console.log(
      `Published ${PLUGIN_SETUP_CONTRACT_NAME} at ${setup.address} in PluginRepo ${PLUGIN_REPO_ENS_SUBDOMAIN_NAME} at ${pluginRepo.address}.`
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

  // Get PluginRepo
  const {pluginRepo} = await findPluginRepo(hre);
  if (pluginRepo === null) {
    throw `PluginRepo '${pluginEnsDomain(hre)}' does not exist yet.`;
  }

  const pastVersions = await getPastVersionCreatedEvents(pluginRepo);

  // Check if the version was published already
  const filteredLogs = pastVersions.filter(
    items =>
      items.event.args.release === VERSION.release &&
      items.event.args.build === VERSION.build
  );

  if (filteredLogs.length !== 0) {
    console.log(
      `Build number ${VERSION.build} has already been published for release ${VERSION.release}. Skipping publication...`
    );
    return true;
  }

  return false;
};
