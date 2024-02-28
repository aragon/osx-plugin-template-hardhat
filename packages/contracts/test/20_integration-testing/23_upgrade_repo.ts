import {getProductionNetworkName, findPluginRepo} from '../../utils/helpers';
import {
  getLatestNetworkDeployment,
  getNetworkNameByAlias,
} from '@aragon/osx-commons-configs';
import {UnsupportedNetworkError} from '@aragon/osx-commons-sdk';
import {
  PluginRepo,
  PluginRepoRegistry,
  PluginRepoRegistry__factory,
} from '@aragon/osx-ethers';
import {loadFixture} from '@nomicfoundation/hardhat-network-helpers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import env, {deployments, ethers} from 'hardhat';

const productionNetworkName = getProductionNetworkName(env);

describe.skip(`PluginRepo upgrading on network '${productionNetworkName}'`, function () {
  describe('UpgradeRepo', async () => {
    it('TODO', async () => {
      const {} = await loadFixture(upgradeRepoFixture);
      expect(false).to.be.true;
      // TODO
    });
  });

  describe.skip('UpgradeAndReinitializeRepo', async () => {
    it('TODO', async () => {
      const {} = await loadFixture(upgradeAndReinitializeRepoFixture);
      expect(false).to.be.true;
      // TODO
    });
  });
});

type FixtureResult = {
  deployer: SignerWithAddress;
  pluginRepo: PluginRepo;
  pluginRepoRegistry: PluginRepoRegistry;
};

async function upgradeRepoFixture(): Promise<FixtureResult> {
  // Deploy all
  const tags = ['UpgradeRepo'];
  await deployments.fixture(tags);

  const [deployer] = await ethers.getSigners();

  // Plugin Repo
  const {pluginRepo, ensDomain} = await findPluginRepo(env);
  if (pluginRepo === null) {
    throw `PluginRepo '${ensDomain}' does not exist yet.`;
  }

  const network = getNetworkNameByAlias(productionNetworkName);
  if (network === null) {
    throw new UnsupportedNetworkError(productionNetworkName);
  }
  const networkDeployments = getLatestNetworkDeployment(network);
  if (networkDeployments === null) {
    throw `Deployments are not available on network ${network}.`;
  }

  // Plugin repo registry
  const pluginRepoRegistry = PluginRepoRegistry__factory.connect(
    networkDeployments.PluginRepoRegistryProxy.address,
    deployer
  );

  return {deployer, pluginRepo, pluginRepoRegistry};
}

async function upgradeAndReinitializeRepoFixture(): Promise<FixtureResult> {
  // Deploy all
  const tags = ['UpgradeAndReinitializeRepo'];
  await deployments.fixture(tags);

  const [deployer] = await ethers.getSigners();

  // Plugin Repo
  const {pluginRepo, ensDomain} = await findPluginRepo(env);
  if (pluginRepo === null) {
    throw `PluginRepo '${ensDomain}' does not exist yet.`;
  }

  const network = getNetworkNameByAlias(productionNetworkName);
  if (network === null) {
    throw new UnsupportedNetworkError(productionNetworkName);
  }
  const networkDeployments = getLatestNetworkDeployment(network);
  if (networkDeployments === null) {
    throw `Deployments are not available on network ${network}.`;
  }

  // Plugin repo registry
  const pluginRepoRegistry = PluginRepoRegistry__factory.connect(
    networkDeployments.PluginRepoRegistryProxy.address,
    deployer
  );

  return {deployer, pluginRepo, pluginRepoRegistry};
}
