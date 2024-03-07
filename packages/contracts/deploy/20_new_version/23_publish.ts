import {
  METADATA,
  PLUGIN_CONTRACT_NAME,
  PLUGIN_REPO_ENS_SUBDOMAIN_NAME,
  PLUGIN_SETUP_CONTRACT_NAME,
  VERSION,
} from '../../plugin-settings';
import {
  findPluginRepo,
  getPastVersionCreatedEvents,
  impersonatedManagementDaoSigner,
  isLocal,
  pluginEnsDomain,
} from '../../utils/helpers';
import {
  PLUGIN_REPO_PERMISSIONS,
  toHex,
  uploadToIPFS,
} from '@aragon/osx-commons-sdk';
import {writeFile} from 'fs/promises';
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from 'hardhat/types';
import path from 'path';

/**
 * Publishes the plugin setup in the plugin repo as a new version as specified in the `./plugin-settings.ts` file.
 * @param {HardhatRuntimeEnvironment} hre
 */
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

  if (setup == undefined || setup?.receipt == undefined) {
    throw Error('setup deployment unavailable');
  }

  const isDeployerMaintainer = await pluginRepo.isGranted(
    pluginRepo.address,
    deployer.address,
    PLUGIN_REPO_PERMISSIONS.MAINTAINER_PERMISSION_ID,
    []
  );

  // If this is a local deployment and the deployer doesn't have `MAINTAINER_PERMISSION_ID`  permission
  // we impersonate the management DAO for integration testing purposes.
  const signer =
    isDeployerMaintainer || !isLocal(hre)
      ? deployer
      : await impersonatedManagementDaoSigner(hre);

  // Check if the signer has the permission to maintain the plugin repo
  if (
    await pluginRepo.isGranted(
      pluginRepo.address,
      signer.address,
      PLUGIN_REPO_PERMISSIONS.MAINTAINER_PERMISSION_ID,
      []
    )
  ) {
    // Create the new version
    const tx = await pluginRepo
      .connect(signer)
      .createVersion(
        VERSION.release,
        setup.address,
        toHex(buildMetadataURI),
        toHex(releaseMetadataURI)
      );

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
    // The deployer does not have `MAINTAINER_PERMISSION_ID` permission and we are not deploying to a production network,
    // so we write the data into a file for a management DAO member to create a proposal from it.
    const data = {
      proposalTitle: `Publish '${PLUGIN_CONTRACT_NAME}' plugin v${VERSION.release}.${VERSION.build}`,
      proposalSummary: `Publishes v${VERSION.release}.${VERSION.build} of the '${PLUGIN_CONTRACT_NAME}' plugin in the '${ensDomain}' plugin repo.`,
      proposalDescription: `Publishes the '${PLUGIN_SETUP_CONTRACT_NAME}' deployed at '${setup.address}' 
      as v${VERSION.release}.${VERSION.build} in the '${ensDomain}' plugin repo at '${pluginRepo.address}', 
      with release metadata '${releaseMetadataURI}' and (immutable) build metadata '${buildMetadataURI}'.`,
      actions: [
        {
          to: pluginRepo.address,
          createVersion: {
            _release: VERSION.release,
            _pluginSetup: setup.address,
            _buildMetadata: toHex(buildMetadataURI),
            _releaseMetadata: toHex(releaseMetadataURI),
          },
        },
      ],
    };

    const path = `./createVersionProposalData-${hre.network.name}.json`;
    await writeFile(path, JSON.stringify(data, null, 2));
    console.log(
      `Saved data to '${path}'. Use this to create a proposal on the managing DAO calling the 'createVersion' function on the ${ensDomain} plugin repo deployed at ${pluginRepo.address}.`
    );
  }
};

export default func;
func.tags = [PLUGIN_SETUP_CONTRACT_NAME, 'NewVersion', 'Publication'];

/**
 * Skips the publication of the specified version if it already exists in the plugin repo.
 * @param {HardhatRuntimeEnvironment} hre
 */
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
