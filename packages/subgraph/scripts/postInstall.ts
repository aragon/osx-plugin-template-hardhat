import fs from 'fs';
// Import the osx-ethers module to access OSX contracts and generate their ABIs for any needed version.
import * as osx120 from 'osx-ethersV120';
import path from 'path';

// Add the contract factories to this array for the contracts you want to generate ABIs for.
const contractFactories = [
  osx120.PluginRepo__factory,
  osx120.PluginSetupProcessor__factory,
];

function generateABIFiles(contractFactories: any[]): void {
  // Iterate through each contract factory passed.
  contractFactories.forEach(contractFactory => {
    // Extract the ABI object and name from the contract factory
    const abiObject: any = contractFactory.abi;
    const abiName: string = contractFactory.name.replace('__factory', '');

    // Construct the file name for the ABI JSON file
    const fileName = `${abiName}.json`;

    // Construct the ABI directory path relative to the project root
    const abisDirectory = path.join(__dirname, '../imported');

    // If the directory does not exist, create it
    if (!fs.existsSync(abisDirectory)) {
      fs.mkdirSync(abisDirectory, {recursive: true});
    }

    // Resolve the full file path
    const filePath = path.resolve(abisDirectory, fileName);

    // Write the ABI object to a JSON file
    fs.writeFileSync(filePath, JSON.stringify(abiObject));

    // Log a message indicating that the ABI file has been generated
    console.log(`ABI file generated for '${abiName}', file: ${filePath}`);
  });
}

// Generate ABI files for the provided parameters in the specified directory
generateABIFiles(contractFactories);
