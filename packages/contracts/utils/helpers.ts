import {activeContractsList} from '@aragon/osx-ethers';
import {ContractFactory, ContractTransaction} from 'ethers';
import {
  Interface,
  LogDescription,
  defaultAbiCoder,
  keccak256,
} from 'ethers/lib/utils';
import {existsSync, statSync, readFileSync, writeFileSync} from 'fs';
import {ethers} from 'hardhat';
import {upgrades} from 'hardhat';

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
  polygon: 'polygon',
  polygonMumbai: 'mumbai',
  baseGoerli: 'baseGoerli',
};

export const ERRORS = {
  ALREADY_INITIALIZED: 'Initializable: contract is already initialized',
};

export function getPluginRepoFactoryAddress(networkName: string) {
  let pluginRepoFactoryAddr: string;

  if (
    networkName === 'localhost' ||
    networkName === 'hardhat' ||
    networkName === 'coverage'
  ) {
    const hardhatForkNetwork = process.env.NETWORK_NAME
      ? process.env.NETWORK_NAME
      : 'mainnet';

    pluginRepoFactoryAddr = osxContracts[hardhatForkNetwork].PluginRepoFactory;
    console.log(
      `Using the "${hardhatForkNetwork}" PluginRepoFactory address (${pluginRepoFactoryAddr}) for deployment testing on network "${networkName}"`
    );
  } else {
    pluginRepoFactoryAddr =
      osxContracts[networkNameMapping[networkName]].PluginRepoFactory;

    console.log(
      `Using the ${networkNameMapping[networkName]} PluginRepoFactory address (${pluginRepoFactoryAddr}) for deployment...`
    );
  }
  return pluginRepoFactoryAddr;
}

export function getPluginInfo(networkName: string): any {
  let pluginInfoFilePath: string;
  let pluginInfo: any = {};

  if (['localhost', 'hardhat', 'coverage'].includes(networkName)) {
    pluginInfoFilePath = 'plugin-info-testing.json';
  } else {
    pluginInfoFilePath = 'plugin-info.json';
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
      'plugin-info-testing.json',
      JSON.stringify(pluginInfo, null, 2) + '\n'
    );
  } else {
    writeFileSync(
      'plugin-info.json',
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

export async function findEvent<T>(tx: ContractTransaction, eventName: string) {
  const receipt = await tx.wait();

  const event = (receipt.events || []).find(event => event.event === eventName);

  return event as T | undefined;
}

export async function findEventTopicLog<T>(
  tx: ContractTransaction,
  iface: Interface,
  eventName: string
): Promise<LogDescription & (T | LogDescription)> {
  const receipt = await tx.wait();
  const topic = iface.getEventTopic(eventName);
  const log = receipt.logs.find(x => x.topics[0] === topic);
  if (!log) {
    throw new Error(`No logs found for the topic of event "${eventName}".`);
  }
  return iface.parseLog(log) as LogDescription & (T | LogDescription);
}

type DeployOptions = {
  constructurArgs?: unknown[];
  proxyType?: 'uups';
};

export async function deployWithProxy<T>(
  contractFactory: ContractFactory,
  options: DeployOptions = {}
): Promise<T> {
  upgrades.silenceWarnings(); // Needed because we pass the `unsafeAllow: ["constructor"]` option.

  return upgrades.deployProxy(contractFactory, [], {
    kind: options.proxyType || 'uups',
    initializer: false,
    unsafeAllow: ['constructor'],
    constructorArgs: options.constructurArgs || [],
  }) as unknown as Promise<T>;
}
