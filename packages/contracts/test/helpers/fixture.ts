import networks from './networks.json';
import {network} from 'hardhat';

export async function initializeFork(
  forkNetwork: string,
  blockNumber: number
): Promise<void> {
  if (!(networks as any)[forkNetwork]) {
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
