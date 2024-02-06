import {
  getLatestNetworkDeployment,
  getNetworkNameByAlias,
} from '@aragon/osx-commons-configs';
import {VersionTag, findEvent} from '@aragon/osx-commons-sdk';
import {
  ENSSubdomainRegistrar__factory,
  ENS__factory,
  IAddrResolver__factory,
  PluginRepo,
  PluginRepoEvents,
  PluginRepo__factory,
} from '@aragon/osx-ethers';
import {ContractTransaction} from 'ethers';
import {LogDescription, defaultAbiCoder, keccak256} from 'ethers/lib/utils';
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

export async function findPluginRepo(
  hre: HardhatRuntimeEnvironment,
  domain: string
): Promise<PluginRepo | null> {
  const [deployer] = await hre.ethers.getSigners();
  const productionNetworkName: string = getProductionNetworkName(hre);

  const registrar = ENSSubdomainRegistrar__factory.connect(
    getLatestNetworkDeployment(getNetworkNameByAlias(productionNetworkName)!)!
      .PluginENSSubdomainRegistrarProxy.address,
    deployer
  );

  // Check if the ens record exists already
  const ens = ENS__factory.connect(await registrar.ens(), deployer);
  const node = ethers.utils.namehash(domain);
  const recordExists = await ens.recordExists(node);

  if (!recordExists) {
    return null;
  } else {
    const resolver = IAddrResolver__factory.connect(
      await ens.resolver(node),
      deployer
    );

    return PluginRepo__factory.connect(await resolver.addr(node), deployer);
  }
}

export type EventWithBlockNumber = {
  event: LogDescription;
  blockNumber: number;
};

export async function getPastVersionCreatedEvents(
  pluginRepo: PluginRepo
): Promise<EventWithBlockNumber[]> {
  const eventFilter = pluginRepo.filters['VersionCreated']();

  const logs = await pluginRepo.provider.getLogs({
    fromBlock: 0,
    toBlock: 'latest',
    address: pluginRepo.address,
    topics: eventFilter.topics,
  });

  return logs.map((log, index) => {
    return {
      event: pluginRepo.interface.parseLog(log),
      blockNumber: logs[index].blockNumber,
    };
  });
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

  const versionCreatedEvent =
    await findEvent<PluginRepoEvents.VersionCreatedEvent>(
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
