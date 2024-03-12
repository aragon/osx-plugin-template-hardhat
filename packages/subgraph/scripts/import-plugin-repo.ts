import {
  SupportedNetworks,
  getNetworkDeployments,
} from '@aragon/osx-commons-configs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Specify the path to the .env file at the root
const rootDir = path.join(__dirname, '../../../'); // Adjust the path as necessary
dotenv.config({path: path.join(rootDir, '.env')});

// Extract Repo address from the production-network-deployments.json
function extractAndWriteAddressToTS(jsonPath: string): void {
  // Read the production-network-deployments.json file

  let aragonDeploymentsInfo;
  try {
    aragonDeploymentsInfo = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (e) {
    console.warn(`Error reading ${jsonPath}: ${e}`);
    // @ts-ignore
    aragonDeploymentsInfo = getNetworkDeployments(
      process.env.SUBGRAPH_NETWORK_NAME as SupportedNetworks
    )['v1.3.0']['PluginRepoBase'];
  }

  console.log(aragonDeploymentsInfo);
  // Get the network from environment variables
  const network = process.env.SUBGRAPH_NETWORK_NAME;

  // Check if the network is defined in aragonDeploymentsInfo
  //   if (!network || !aragonDeploymentsInfo[network]) {
  //     throw new Error(
  //       `Network '${network}' not found in production-network-deployments.json`
  //     );
  //   }

  // Start the Map creation code with the specific network address
  //   const tsContent: string[] = [
  //     // @ts-ignore
  //     `export const PLUGIN_REPO_ADDRESS = '${aragonDeploymentsInfo[network].address}';`,
  //   ];

  const tsContent: string[] = [
    // @ts-ignore
    `export const PLUGIN_REPO_ADDRESS = '${aragonDeploymentsInfo.address}';`,
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

const aragonDeploymentsInfoPath = path.join(
  rootDir,
  'production-network-deployments.json'
);
extractAndWriteAddressToTS(aragonDeploymentsInfoPath);
