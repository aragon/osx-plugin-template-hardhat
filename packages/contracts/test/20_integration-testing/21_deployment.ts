import {METADATA} from '../../plugin-settings';
import {getProductionNetworkName, findPluginRepo} from '../../utils/helpers';
import {
  getLatestNetworkDeployment,
  getNetworkNameByAlias,
} from '@aragon/osx-commons-configs';
import {
  DAO_PERMISSIONS,
  PERMISSION_MANAGER_FLAGS,
  PLUGIN_REPO_PERMISSIONS,
  toHex,
  uploadToIPFS,
} from '@aragon/osx-commons-sdk';
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

describe(`Deployment on network '${productionNetworkName}'`, function () {
  it('creates the repo', async () => {
    const {pluginRepo, pluginRepoRegistry} = await loadFixture(fixture);

    expect(await pluginRepoRegistry.entries(pluginRepo.address)).to.be.true;
  });

  it('makes the deployer the repo maintainer', async () => {
    const {deployer, pluginRepo} = await loadFixture(fixture);

    expect(
      await pluginRepo.isGranted(
        pluginRepo.address,
        deployer.address,
        DAO_PERMISSIONS.ROOT_PERMISSION_ID,
        PERMISSION_MANAGER_FLAGS.NO_CONDITION
      )
    ).to.be.true;

    expect(
      await pluginRepo.isGranted(
        pluginRepo.address,
        deployer.address,
        PLUGIN_REPO_PERMISSIONS.UPGRADE_REPO_PERMISSION_ID,
        PERMISSION_MANAGER_FLAGS.NO_CONDITION
      )
    ).to.be.true;

    expect(
      await pluginRepo.isGranted(
        pluginRepo.address,
        deployer.address,
        PLUGIN_REPO_PERMISSIONS.MAINTAINER_PERMISSION_ID,
        PERMISSION_MANAGER_FLAGS.NO_CONDITION
      )
    ).to.be.true;
  });

  context('PluginSetup Publication', async () => {
    it('registers the setup', async () => {
      const {pluginRepo} = await loadFixture(fixture);

      await pluginRepo['getVersion((uint8,uint16))']({
        release: 1,
        build: 1,
      });

      const results = await pluginRepo['getVersion((uint8,uint16))']({
        release: 1,
        build: 1,
      });

      const buildMetadataURI = `ipfs://${await uploadToIPFS(
        JSON.stringify(METADATA.build, null, 2)
      )}`;

      expect(results.buildMetadata).to.equal(toHex(buildMetadataURI));
    });
  });
});

type FixtureResult = {
  deployer: SignerWithAddress;
  pluginRepo: PluginRepo;
  pluginRepoRegistry: PluginRepoRegistry;
};

async function fixture(): Promise<FixtureResult> {
  // Deploy all
  const tags = ['CreateRepo', 'NewVersion'];
  await deployments.fixture(tags);

  const [deployer] = await ethers.getSigners();

  // Plugin repo registry
  const pluginRepoRegistry = PluginRepoRegistry__factory.connect(
    getLatestNetworkDeployment(getNetworkNameByAlias(productionNetworkName)!)!
      .PluginRepoRegistryProxy.address,
    deployer
  );

  const {pluginRepo, ensDomain} = await findPluginRepo(env);
  if (pluginRepo === null) {
    throw `PluginRepo '${ensDomain}' does not exist yet.`;
  }

  return {deployer, pluginRepo, pluginRepoRegistry};
}