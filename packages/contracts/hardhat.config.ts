import {
  addRpcUrlToNetwork,
  networks as osxCommonsConfigNetworks,
  SupportedNetworks,
} from '@aragon/osx-commons-configs';
import '@nomicfoundation/hardhat-chai-matchers';
import '@nomicfoundation/hardhat-toolbox';
import '@nomiclabs/hardhat-etherscan';
import '@openzeppelin/hardhat-upgrades';
import '@typechain/hardhat';
import {config as dotenvConfig} from 'dotenv';
import {BigNumber, ethers} from 'ethers';
import 'hardhat-deploy';
import 'hardhat-gas-reporter';
import {extendEnvironment, HardhatUserConfig} from 'hardhat/config';
import {
  HardhatNetworkAccountsUserConfig,
  HardhatRuntimeEnvironment,
} from 'hardhat/types';
import type {NetworkUserConfig} from 'hardhat/types';
import {resolve} from 'path';
import 'solidity-coverage';

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || '../../.env';
dotenvConfig({path: resolve(__dirname, dotenvConfigPath), override: true});

// check alchemy Api key existence
if (process.env.ALCHEMY_API_KEY) {
  addRpcUrlToNetwork(process.env.ALCHEMY_API_KEY);
} else {
  throw new Error('ALCHEMY_API_KEY in .env not set');
}

// Fetch the accounts specified in the .env file
function specifiedAccounts(): string[] {
  return process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.split(',') : [];
}

function getHardhatNetworkAccountsConfig(
  numAccounts: number
): HardhatNetworkAccountsUserConfig {
  const hardhatDefaultMnemonic =
    'test test test test test test test test test test test junk';

  const hardhatDefaultAccounts = Array(numAccounts)
    .fill(0)
    .map(
      (_, i) =>
        ethers.Wallet.fromMnemonic(
          hardhatDefaultMnemonic,
          `m/44'/60'/0'/0/${i}`
        ).privateKey
    );

  const specAccounts = specifiedAccounts();
  const accounts = specAccounts.concat(
    hardhatDefaultAccounts.slice(specAccounts.length)
  );

  const accountsConfig: HardhatNetworkAccountsUserConfig = accounts.map(
    privateKey => {
      const oneEther = BigNumber.from(10).pow(18);
      return {
        privateKey,
        balance: oneEther.mul(100).toString(), // 100 ether
      };
    }
  );

  return accountsConfig;
}

// Add the accounts specified in the `.env` file to the networks from osx-commons-configs
const networks: {[index: string]: NetworkUserConfig} = osxCommonsConfigNetworks;
for (const network of Object.keys(networks) as SupportedNetworks[]) {
  networks[network].accounts = specifiedAccounts();
}

// Extend HardhatRuntimeEnvironment
extendEnvironment((hre: HardhatRuntimeEnvironment) => {
  hre.aragonToVerifyContracts = [];
});

const namedAccounts = {
  deployer: 0,
  alice: 1,
  bob: 2,
  carol: 3,
  dave: 4,
  eve: 5,
  frank: 6,
  grace: 7,
  harold: 8,
  ivan: 9,
  judy: 10,
  mallory: 11,
};

const config: HardhatUserConfig = {
  namedAccounts,
  networks: {
    hardhat: {
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      blockGasLimit: BigNumber.from(10).pow(6).mul(30).toNumber(), // 30 million, really high to test some things that are only possible with a higher block gas limit
      gasPrice: BigNumber.from(10).pow(9).mul(150).toNumber(), // 150 gwei
      accounts: getHardhatNetworkAccountsConfig(
        Object.keys(namedAccounts).length
      ),
    },
    ...networks,
  },

  defaultNetwork: 'hardhat',
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || '',
      goerli: process.env.ETHERSCAN_API_KEY || '',
      sepolia: process.env.ETHERSCAN_API_KEY || '',
      polygon: process.env.POLYGONSCAN_API_KEY || '',
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || '',
      base: process.env.BASESCAN_API_KEY || '',
      baseGoerli: process.env.BASESCAN_API_KEY || '',
      arbitrumOne: process.env.ARBISCAN_API_KEY || '',
      arbitrumGoerli: process.env.ARBISCAN_API_KEY || '',
    },
    customChains: [
      {
        network: 'sepolia',
        chainId: 11155111,
        urls: {
          apiURL: 'https://api-sepolia.etherscan.io/api',
          browserURL: 'https://sepolia.etherscan.io',
        },
      },
      {
        network: 'base',
        chainId: 8453,
        urls: {
          apiURL: 'https://api.basescan.org/api',
          browserURL: 'https://basescan.org',
        },
      },
      {
        network: 'baseGoerli',
        chainId: 84531,
        urls: {
          apiURL: 'https://api-goerli.basescan.org/api',
          browserURL: 'https://goerli.basescan.org',
        },
      },
    ],
  },

  gasReporter: {
    currency: 'USD',
    enabled: process.env.REPORT_GAS === 'true' ? true : false,
    excludeContracts: [],
    src: './contracts',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  paths: {
    artifacts: './artifacts',
    cache: './cache',
    sources: './src',
    tests: './test',
    deploy: './deploy',
  },

  solidity: {
    version: '0.8.17',
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/hardhat-template/issues/31
        bytecodeHash: 'none',
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
};

export default config;
