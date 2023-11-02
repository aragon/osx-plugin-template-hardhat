require('@nomiclabs/hardhat-ethers');
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.19',
  networks: {
    hardhat: {
      forking: {
        url: 'https://example.com',
        blockNumber: 1,
        enabled: false, // Disables forking for tests
      },
      chainId: 5,
      accounts: {
        count: 3,
      },
    },
  },
};
