import {
  SupportedNetworks,
  getNetwork,
  getNetworkDeployments,
} from '@aragon/osx-commons-configs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

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
  const network = process.env.SUBGRAPH_NETWORK_NAME;

  if (!network) {
    throw new Error('SUBGRAPH_NETWORK_NAME environment variable not set');
  }

  const address = getPluginRepoAddress(network);

  const tsContent: string[] = [
    `export const PLUGIN_REPO_ADDRESS = '${address}';`,
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
