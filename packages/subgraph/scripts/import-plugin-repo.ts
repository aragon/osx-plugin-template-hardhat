import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Specify the path to the .env file at the root
const rootDir = path.join(__dirname, '../../../'); // Adjust the path as necessary
dotenv.config({path: path.join(rootDir, '.env')});

// Extract Repo address from the plugin-info.json
function extractAndWriteAddressToTS(jsonPath: string): void {
  // Read the plugin-info.json file
  const pluginInfo = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  // Get the network from environment variables
  const network = process.env.SUBGRAPH_NETWORK_NAME;

  // Check if the network is defined in pluginInfo
  if (!network || !pluginInfo[network]) {
    throw new Error(`Network '${network}' not found in plugin-info.json`);
  }

  // Start the Map creation code with the specific network address
  const tsContent: string[] = [
    `export const PLUGIN_REPO_ADDRESS = '${pluginInfo[network].address}';`,
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

const pluginInfoPath = path.join(rootDir, 'plugin-info.json');
extractAndWriteAddressToTS(pluginInfoPath);
