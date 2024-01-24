import {activeContractsList} from '@aragon/osx-ethers';
import {defaultAbiCoder, keccak256} from 'ethers/lib/utils';
import {existsSync, statSync, readFileSync, writeFileSync} from 'fs';
import {ethers} from 'hardhat';

export type NetworkNameMapping = {[index: string]: string};

export type ContractList = {[index: string]: {[index: string]: string}};

export type ContractBlockNumberList = {
  // network
  [index: string]: {[index: string]: {address: string; blockNumber: number}};
};

export const osxContracts: ContractList = activeContractsList;

export const networkNameMapping: NetworkNameMapping = {
  mainnet: 'mainnet',
  goerli: 'goerli',
  sepolia: 'sepolia',
  polygon: 'polygon',
  polygonMumbai: 'mumbai',
  base: 'base',
  baseGoerli: 'baseGoerli',
  arbitrum: 'arbitrum',
  arbitrumGoerli: 'arbitrumGoerli',
};

export const ERRORS = {
  ALREADY_INITIALIZED: 'Initializable: contract is already initialized',
};

export function getPluginRepoFactoryAddress(networkName: string) {
  return getContractAddress(networkName, 'PluginRepoFactory');
}

export function getPluginRepoRegistryAddress(networkName: string) {
  return getContractAddress(networkName, 'PluginRepoRegistry');
}

function getContractAddress(networkName: string, contractName: string) {
  let contractAddr: string;

  if (
    networkName === 'localhost' ||
    networkName === 'hardhat' ||
    networkName === 'coverage'
  ) {
    const hardhatForkNetwork = process.env.NETWORK_NAME
      ? process.env.NETWORK_NAME
      : 'mainnet';

    contractAddr = osxContracts[hardhatForkNetwork][contractName];
    console.log(
      `Using the "${hardhatForkNetwork}" ${contractName} address (${contractAddr}) for deployment testing on network "${networkName}"`
    );
  } else {
    contractAddr = osxContracts[networkNameMapping[networkName]][contractName];

    console.log(
      `Using the ${networkNameMapping[networkName]} ${contractName} address (${contractAddr}) for deployment...`
    );
  }
  return contractAddr;
}

export function getPluginInfo(networkName: string): any {
  let pluginInfoFilePath: string;
  let pluginInfo: any = {};

  if (['localhost', 'hardhat', 'coverage'].includes(networkName)) {
    pluginInfoFilePath = '../../plugin-info-testing.json';
  } else {
    pluginInfoFilePath = '../../plugin-info.json';
  }

  if (
    existsSync(pluginInfoFilePath) &&
    statSync(pluginInfoFilePath).size !== 0
  ) {
    pluginInfo = JSON.parse(readFileSync(pluginInfoFilePath, 'utf-8'));

    if (!pluginInfo[networkName]) {
      pluginInfo[networkName] = {};
    }
  } else {
    pluginInfo[networkName] = {};
  }
  return pluginInfo;
}

function storePluginInfo(networkName: string, pluginInfo: any) {
  if (['localhost', 'hardhat', 'coverage'].includes(networkName)) {
    writeFileSync(
      '../../plugin-info-testing.json',
      JSON.stringify(pluginInfo, null, 2) + '\n'
    );
  } else {
    writeFileSync(
      '../../plugin-info.json',
      JSON.stringify(pluginInfo, null, 2) + '\n'
    );
  }
}

export function addDeployedRepo(
  networkName: string,
  repoName: string,
  contractAddr: string,
  args: [],
  blockNumber: number
) {
  const pluginInfo = getPluginInfo(networkName);

  pluginInfo[networkName]['repo'] = repoName;
  pluginInfo[networkName]['address'] = contractAddr;
  pluginInfo[networkName]['args'] = args;
  pluginInfo[networkName]['blockNumberOfDeployment'] = blockNumber;

  storePluginInfo(networkName, pluginInfo);
}

export function addCreatedVersion(
  networkName: string,
  version: {release: number; build: number},
  metadataURIs: {release: string; build: string},
  blockNumberOfPublication: number,
  setup: {
    name: string;
    address: string;
    args: [];
    blockNumberOfDeployment: number;
  },
  implementation: {
    name: string;
    address: string;
    args: [];
    blockNumberOfDeployment: number;
  },
  helpers:
    | [
        {
          name: string;
          address: string;
          args: [];
          blockNumberOfDeployment: number;
        }
      ]
    | []
) {
  const pluginInfo = getPluginInfo(networkName);

  // Releases can already exist
  if (!pluginInfo[networkName]['releases']) {
    pluginInfo[networkName]['releases'] = {};
  }
  if (!pluginInfo[networkName]['releases'][version.release]) {
    pluginInfo[networkName]['releases'][version.release] = {};
    pluginInfo[networkName]['releases'][version.release]['builds'] = {};
  }

  // Update the releaseMetadataURI
  pluginInfo[networkName]['releases'][version.release]['releaseMetadataURI'] =
    metadataURIs.release;

  pluginInfo[networkName]['releases'][`${version.release}`]['builds'][
    `${version.build}`
  ] = {};

  pluginInfo[networkName]['releases'][`${version.release}`]['builds'][
    `${version.build}`
  ] = {
    setup: setup,
    implementation: implementation,
    helpers: helpers,
    buildMetadataURI: metadataURIs.build,
    blockNumberOfPublication: blockNumberOfPublication,
  };

  storePluginInfo(networkName, pluginInfo);
}

export function toBytes(string: string) {
  return ethers.utils.formatBytes32String(string);
}

export function hashHelpers(helpers: string[]) {
  return keccak256(defaultAbiCoder.encode(['address[]'], [helpers]));
}
