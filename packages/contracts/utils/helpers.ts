import {VersionCreatedEvent} from '../typechain/@aragon/osx/framework/plugin/repo/PluginRepo';
import {VersionTag, findEvent} from '@aragon/osx-commons-sdk';
import {PluginRepo__factory} from '@aragon/osx-ethers';
import {ContractTransaction} from 'ethers';
import {defaultAbiCoder, keccak256} from 'ethers/lib/utils';
import {existsSync, statSync, readFileSync, writeFileSync} from 'fs';
import {ethers} from 'hardhat';
import {HardhatRuntimeEnvironment} from 'hardhat/types';

export function isLocal(hre: HardhatRuntimeEnvironment): boolean {
  return (
    hre.network.name === 'localhost' ||
    hre.network.name === 'hardhat' ||
    hre.network.name === 'coverage'
  );
}

export function getProductionNetworkName(hre: HardhatRuntimeEnvironment) {
  let productionNetworkName: string;
  if (isLocal(hre)) {
    productionNetworkName = process.env.NETWORK_NAME
      ? process.env.NETWORK_NAME
      : 'sepolia';
  } else {
    productionNetworkName = hre.network.name;
  }
  return productionNetworkName;
}

export function getAragonDeploymentsInfo(networkName: string): any {
  let aragonDeploymentsInfoFilePath: string;
  let aragonDeploymentsInfo: any = {};

  if (['localhost', 'hardhat', 'coverage'].includes(networkName)) {
    aragonDeploymentsInfoFilePath = '../../local-network-deployments.json';
  } else {
    aragonDeploymentsInfoFilePath = '../../production-network-deployments.json';
  }

  if (
    existsSync(aragonDeploymentsInfoFilePath) &&
    statSync(aragonDeploymentsInfoFilePath).size !== 0
  ) {
    aragonDeploymentsInfo = JSON.parse(
      readFileSync(aragonDeploymentsInfoFilePath, 'utf-8')
    );

    if (!aragonDeploymentsInfo[networkName]) {
      aragonDeploymentsInfo[networkName] = {};
    }
  } else {
    aragonDeploymentsInfo[networkName] = {};
  }
  return aragonDeploymentsInfo;
}

export function copyAragonDeploymentsInfoFromProdToLocal(
  hre: HardhatRuntimeEnvironment
) {
  const productionNetworkName = getProductionNetworkName(hre);

  const objToStore: any = {};
  objToStore[hre.network.name] = getAragonDeploymentsInfo(
    productionNetworkName
  )[productionNetworkName];

  writeFileSync(
    '../../local-network-deployments.json',
    JSON.stringify(objToStore, null, 2) + '\n'
  );
}

function storePluginInfo(networkName: string, aragonDeploymentsInfo: any) {
  if (['localhost', 'hardhat', 'coverage'].includes(networkName)) {
    writeFileSync(
      '../../local-network-deployments.json',
      JSON.stringify(aragonDeploymentsInfo, null, 2) + '\n'
    );
  } else {
    writeFileSync(
      '../../production-network-deployments.json',
      JSON.stringify(aragonDeploymentsInfo, null, 2) + '\n'
    );
  }
}

export function clearPluginInfo(networkName: string) {
  if (['localhost', 'hardhat', 'coverage'].includes(networkName)) {
    writeFileSync(
      '../../local-network-deployments.json',
      JSON.stringify({}, null, 2) + '\n'
    );
  } else {
    throw "Information will be lost. You must delete 'production-network-deployments.json' manually.";
  }
}

export function addDeployedRepo(
  networkName: string,
  repoName: string,
  contractAddr: string,
  args: unknown[],
  blockNumber: number
) {
  const aragonDeploymentsInfo = getAragonDeploymentsInfo(networkName);

  aragonDeploymentsInfo[networkName]['repo'] = repoName;
  aragonDeploymentsInfo[networkName]['address'] = contractAddr;
  aragonDeploymentsInfo[networkName]['args'] = args;
  aragonDeploymentsInfo[networkName]['blockNumberOfDeployment'] = blockNumber;

  storePluginInfo(networkName, aragonDeploymentsInfo);
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
  const aragonDeploymentsInfo = getAragonDeploymentsInfo(networkName);

  // Releases can already exist
  if (!aragonDeploymentsInfo[networkName]['releases']) {
    aragonDeploymentsInfo[networkName]['releases'] = {};
  }
  if (!aragonDeploymentsInfo[networkName]['releases'][version.release]) {
    aragonDeploymentsInfo[networkName]['releases'][version.release] = {};
    aragonDeploymentsInfo[networkName]['releases'][version.release]['builds'] =
      {};
  }

  // Update the releaseMetadataURI
  aragonDeploymentsInfo[networkName]['releases'][version.release][
    'releaseMetadataURI'
  ] = metadataURIs.release;

  aragonDeploymentsInfo[networkName]['releases'][`${version.release}`][
    'builds'
  ][`${version.build}`] = {};

  aragonDeploymentsInfo[networkName]['releases'][`${version.release}`][
    'builds'
  ][`${version.build}`] = {
    setup: setup,
    implementation: implementation,
    helpers: helpers,
    buildMetadataURI: metadataURIs.build,
    blockNumberOfPublication: blockNumberOfPublication,
  };

  storePluginInfo(networkName, aragonDeploymentsInfo);
}

export function toBytes(string: string) {
  return ethers.utils.formatBytes32String(string);
}

export function hashHelpers(helpers: string[]) {
  return keccak256(defaultAbiCoder.encode(['address[]'], [helpers]));
}

export type LatestVersion = {
  versionTag: VersionTag;
  pluginSetupContract: string;
  releaseMetadata: string;
  buildMetadata: string;
};

export async function createVersion(
  pluginRepoContract: string,
  pluginSetupContract: string,
  releaseNumber: number,
  releaseMetadata: string,
  buildMetadata: string
): Promise<ContractTransaction> {
  const signers = await ethers.getSigners();

  const PluginRepo = new PluginRepo__factory(signers[0]);
  const pluginRepo = PluginRepo.attach(pluginRepoContract);

  const tx = await pluginRepo.createVersion(
    releaseNumber,
    pluginSetupContract,
    buildMetadata,
    releaseMetadata
  );

  console.log(`Creating build for release ${releaseNumber} with tx ${tx.hash}`);

  await tx.wait();

  const versionCreatedEvent = await findEvent<VersionCreatedEvent>(
    tx,
    pluginRepo.interface.events['VersionCreated(uint8,uint16,address,bytes)']
      .name
  );

  // Check if versionCreatedEvent is not undefined
  if (versionCreatedEvent) {
    console.log(
      `Created build ${versionCreatedEvent.args.build} for release ${
        versionCreatedEvent.args.release
      } with setup address: ${
        versionCreatedEvent.args.pluginSetup
      }, with build metadata ${ethers.utils.toUtf8String(
        buildMetadata
      )} and release metadata ${ethers.utils.toUtf8String(releaseMetadata)}`
    );
  } else {
    // Handle the case where the event is not found
    throw new Error('Failed to get VersionCreatedEvent event log');
  }
  return tx;
}

export const AragonOSxAsciiArt =
  "                                          ____   _____      \n     /\\                                  / __ \\ / ____|     \n    /  \\   _ __ __ _  __ _  ___  _ __   | |  | | (_____  __ \n   / /\\ \\ | '__/ _` |/ _` |/ _ \\| '_ \\  | |  | |\\___ \\ \\/ / \n  / ____ \\| | | (_| | (_| | (_) | | | | | |__| |____) >  <  \n /_/    \\_\\_|  \\__,_|\\__, |\\___/|_| |_|  \\____/|_____/_/\\_\\ \n                      __/ |                                 \n                     |___/                                  \n";
