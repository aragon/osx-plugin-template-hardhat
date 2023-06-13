import artifacts from '@aragon/osx-artifacts';
import fs from 'fs';
import path from 'path';

// Extract the parameters from the arguments
const params = ['PluginRepo', 'PluginSetupProcessor'];

function generateABIFiles(params: string[]): void {
  params.forEach(param => {
    const artifact = (artifacts as any)[param];

    if (!artifact) {
      throw new Error(`Artifact not found for: ${param}`);
    }

    const abiObject: any = artifact;

    // Write the ABI object to a JSON file
    const fileName = `${param}.json`;

    // Construct the ABI directory path relative to the project root
    const abisDirectory = path.join(__dirname, '../abis/generated');

    const filePath = path.resolve(abisDirectory, fileName);
    fs.writeFileSync(filePath, JSON.stringify(abiObject));

    console.log(`ABI file generated for '${param}', file: ${filePath}`);
  });
}

// Generate ABI files for the provided parameters in the specified directory
generateABIFiles(params);
