import {SupportedNetworks} from '@aragon/osx-commons-configs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// Specify the path to the .env file at the root
const rootDir = path.join(__dirname, '../../../'); // Adjust the path as necessary
dotenv.config({path: path.join(rootDir, '.env')});
// path to the networks manifests
const manifestsPath = path.join(__dirname, '../manifest/data');

function extractAndWriteAddressToTS(): void {
  // Get the network from environment variables
  const network = process.env.SUBGRAPH_NETWORK_NAME;

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
