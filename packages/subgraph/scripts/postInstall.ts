import fs from 'fs';
import * as osx120 from 'osx-ethersV120';
import path from 'path';

// Extract the parameters from the arguments
const params = [
  osx120.PluginRepoFactory__factory,
  osx120.PluginSetupProcessor__factory,
];

function generateABIFiles(params: any[]): void {
  params.forEach(param => {
    const abiObject: any = param.abi;
    const abiName: string = param.name.replace('__factory', '');

    // Write the ABI object to a JSON file
    const fileName = `${abiName}.json`;

    // Construct the ABI directory path relative to the project root
    const abisDirectory = path.join(__dirname, '../abis/generated');

    // Check if directory exists, if not create it
    if (!fs.existsSync(abisDirectory)) {
      fs.mkdirSync(abisDirectory, {recursive: true});
    }

    const filePath = path.resolve(abisDirectory, fileName);
    fs.writeFileSync(filePath, JSON.stringify(abiObject));

    console.log(`ABI file generated for '${abiName}', file: ${filePath}`);
  });
}

// Generate ABI files for the provided parameters in the specified directory
generateABIFiles(params);
