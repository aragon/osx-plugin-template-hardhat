import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Specify the path to the .env file at the root
const rootDir = path.join(__dirname, '../../../'); // Adjust the path as necessary
dotenv.config({path: path.join(rootDir, '.env')});

// Extract Repo address from the production-network-deployments.json
function writeAddressToTS(): void {
  const network = process.env.SUBGRAPH_NETWORK_NAME;
  if (network !== 'sepolia') {
    throw 'The plugin repo address has been hardcoded only for sepolia for now.';
  }
  const sepoliaAddr = '0x9e7956C8758470dE159481e5DD0d08F8B59217A2';

  // Start the Map creation code with the specific network address
  const tsContent: string[] = [
    `export const PLUGIN_REPO_ADDRESS = '${sepoliaAddr}';`,
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

writeAddressToTS();
