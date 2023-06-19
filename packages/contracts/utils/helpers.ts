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
  arbitrumOne: 'ERROR: Not available yet.',
  arbitrumGoerli: 'ERROR: Not available yet.',
  mainnet: 'mainnet',
  goerli: 'goerli',
  polygon: 'polygon',
  polygonMumbai: 'mumbai',
};

export const ERRORS = {
  ALREADY_INITIALIZED: 'Initializable: contract is already initialized',
};

const pluginInfoFilePath = 'plugin_info.json';

export function getPluginInfo(): any {
  return JSON.parse(readFileSync(pluginInfoFilePath, 'utf-8'));
}

export function addDeployedRepo(
  networkName: string,
  repoName: string,
  contractAddr: string,
  blockNumber: number
) {
  let pluginInfo: any;

  // Check if the file exists and is not empty
  if (
    existsSync(pluginInfoFilePath) &&
    statSync(pluginInfoFilePath).size !== 0
  ) {
    pluginInfo = JSON.parse(readFileSync(pluginInfoFilePath, 'utf-8'));
  } else {
    pluginInfo = {};
  }

  if (!pluginInfo[networkName]) {
    pluginInfo[networkName] = {};
  }

  pluginInfo[networkName]['repo'] = repoName;
  pluginInfo[networkName]['address'] = contractAddr;
  pluginInfo[networkName]['blockNumberOfDeployment'] = blockNumber;

  writeFileSync('plugin_info.json', JSON.stringify(pluginInfo, null, 2) + '\n');
}

export function addCreatedVersion(
  networkName: string,
  version: {release: number; build: number},
  metadataURIs: {release: string; build: string},
  blockNumberOfPublication: number,
  setup: {
    name: string;
    address: string;
    blockNumberOfDeployment: number;
  }
) {
  let pluginInfo: any;

  // Check if the file exists and is not empty
  if (
    existsSync(pluginInfoFilePath) &&
    statSync(pluginInfoFilePath).size !== 0
  ) {
    pluginInfo = JSON.parse(readFileSync(pluginInfoFilePath, 'utf-8'));
  } else {
    throw Error('plugiInfo.json file missing');
  }

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

  /*
  // The build should not exist already
  if (
    pluginInfo[networkName]['releases'][`${version.release}`]['builds'][
      `${version.build}`
    ]
  ) {
    throw new Error(
      `Build ${version.build} already exists in release ${version.release}.`
    );
  }*/

  pluginInfo[networkName]['releases'][`${version.release}`]['builds'][
    `${version.build}`
  ] = {};

  pluginInfo[networkName]['releases'][`${version.release}`]['builds'][
    `${version.build}`
  ] = {
    setup: setup,
    buildMetadataURI: metadataURIs.build,
    blockNumberOfPublication: blockNumberOfPublication,
  };

  writeFileSync('plugin_info.json', JSON.stringify(pluginInfo, null, 2) + '\n');
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

export async function findEventTopicLog(
  tx: ContractTransaction,
  iface: Interface,
  eventName: string
): Promise<LogDescription> {
  const receipt = await tx.wait();
  const topic = iface.getEventTopic(eventName);
  const log = receipt.logs.find(x => x.topics[0] == topic);
  if (!log) {
    throw new Error(`No logs found for this event ${eventName} topic.`);
  }
  return iface.parseLog(log);
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
