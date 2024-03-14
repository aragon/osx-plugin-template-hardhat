import {
  SupportedNetworks,
  getNetworkDeployments,
} from '@aragon/osx-commons-configs';
import {SupportedNetworks} from '@aragon/osx-commons-configs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// Specify the path to the .env file at the root
const rootDir = path.join(__dirname, '../../../'); // Adjust the path as necessary
dotenv.config({path: path.join(rootDir, '.env')});

const OSX_VERSION = 'v1.3.0';
const PLUGIN_REPO_NAME = 'TokenVotingRepoProxy';

/**
 * TODO: this is coupled tightly with OSx core and framework,
 * long term do we expect the enshrined plugins to always be available?
 */
function getPluginRepoAddress(network: string): string {
  // we cast this as we do a runtime check for the network in the next line
  const networkDeployments = getNetworkDeployments(
    network as SupportedNetworks
  );
  if (
    !networkDeployments ||
    !networkDeployments[OSX_VERSION] ||
    !networkDeployments[OSX_VERSION][PLUGIN_REPO_NAME]
  ) {
    throw new Error(
      `${PLUGIN_REPO_NAME} not found in network deployments for ${OSX_VERSION} on ${network} network.`
    );
  }
  return networkDeployments[OSX_VERSION][PLUGIN_REPO_NAME].address;
}

/**
 * Retrieves the deployed plugin repository address from osx-commons-configs.
 * This address is saved then used when building the subgraph.
 */
function extractAndWriteAddressToTS(): void {
  // Read the production-network-deployments.json file
// path to the networks manifests
const manifestsPath = path.join(__dirname, '../manifest/data');

function extractAndWriteAddressToTS(): void {
  // Get the network from environment variables
  const network = process.env.SUBGRAPH_NETWORK_NAME;

  if (!network) {
    throw new Error('SUBGRAPH_NETWORK_NAME environment variable not set');
  }

  const address = getPluginRepoAddress(network);

  // Check if the network is provided and supported
  if (
    !network ||
    !Object.values(SupportedNetworks).includes(network as SupportedNetworks)
  ) {
    throw new Error(`Network '${network}' invalid or not Supported.`);
  }

  // get the plugin address from the network manifest
  const networkManifestPath = path.join(manifestsPath, `${network}.json`);
  let networkRepoAddress = JSON.parse(
    fs.readFileSync(networkManifestPath, 'utf8')
  ).dataSources.Plugin.address;

  // check if address is null and throw warning and continue with zero address
  if (!networkRepoAddress) {
    console.warn(
      '\x1b[33m%s\x1b[0m',
      `WARNING: Plugin address for network '${network}' is null. Using zero address.`
    );
    networkRepoAddress = ZERO_ADDRESS;
  }

  const tsContent: string[] = [
    `export const PLUGIN_REPO_ADDRESS = '${address}';`,
    `export const PLUGIN_REPO_ADDRESS = '${networkRepoAddress}';`,
  ];

  const outputDir = path.join(__dirname, '../imported');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, {recursive: true});
  }

  // Write the TypeScript content to a new TS file
  const outputTSFile = path.join(outputDir, 'repo-address.ts');
  fs.writeFileSync(outputTSFile, tsContent.join('\n'));

  console.log(
    `TypeScript address file for network '${network}' generated at ${outputTSFile}`
  );
}

extractAndWriteAddressToTS();
