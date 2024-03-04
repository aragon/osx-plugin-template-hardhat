import networks from '@aragon/osx-commons-configs';
import {getNetworkByNameOrAlias} from '@aragon/osx-commons-configs';
import {network, deployments} from 'hardhat';

export interface ForkOsxVersion {
  version: string;
  activeContracts: any;
  forkBlockNumber: number;
}

export async function initializeFork(
  forkNetwork: string,
  blockNumber: number
): Promise<void> {
  if (getNetworkByNameOrAlias(forkNetwork) === null) {
    throw new Error(`No info found for network '${forkNetwork}'.`);
  }

  await network.provider.request({
    method: 'hardhat_reset',
    params: [
      {
        forking: {
          jsonRpcUrl: `${(networks as any)[forkNetwork].url}`,
          blockNumber: blockNumber,
        },
      },
    ],
  });
}

export async function initializeDeploymentFixture(tag: string | string[]) {
  const fixture = deployments.createFixture(async () => {
    await deployments.fixture(tag); // ensure you start from a fresh deployments
  });

  await fixture();
}
