import {createDaoProxy} from '../10_unit-testing/11_plugin';
import {METADATA, VERSION} from '../../plugin-settings';
import {AdminSetup, AdminSetup__factory, Admin__factory} from '../../typechain';
import {getProductionNetworkName, findPluginRepo} from '../../utils/helpers';
import {installPLugin, uninstallPLugin} from './test-helpers';
import {
  getLatestNetworkDeployment,
  getNetworkNameByAlias,
} from '@aragon/osx-commons-configs';
import {
  DAO_PERMISSIONS,
  PLUGIN_SETUP_PROCESSOR_PERMISSIONS,
  UnsupportedNetworkError,
  getNamedTypesFromMetadata,
} from '@aragon/osx-commons-sdk';
import {
  PluginSetupProcessor,
  PluginRepo,
  PluginSetupProcessorStructs,
  PluginSetupProcessor__factory,
  DAO,
} from '@aragon/osx-ethers';
import {loadFixture} from '@nomicfoundation/hardhat-network-helpers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import env, {deployments, ethers} from 'hardhat';

const productionNetworkName = getProductionNetworkName(env);

describe(`PluginSetup processing on network '${productionNetworkName}'`, function () {
  it('installs & uninstalls the current build', async () => {
    const {alice, deployer, psp, dao, pluginSetupRef} = await loadFixture(
      fixture
    );

    // Grant deployer all required permissions
    await dao
      .connect(deployer)
      .grant(
        psp.address,
        deployer.address,
        PLUGIN_SETUP_PROCESSOR_PERMISSIONS.APPLY_INSTALLATION_PERMISSION_ID
      );
    await dao
      .connect(deployer)
      .grant(
        psp.address,
        deployer.address,
        PLUGIN_SETUP_PROCESSOR_PERMISSIONS.APPLY_UNINSTALLATION_PERMISSION_ID
      );
    await dao
      .connect(deployer)
      .grant(dao.address, psp.address, DAO_PERMISSIONS.ROOT_PERMISSION_ID);

    // Install the current build.
    const results = await installPLugin(
      deployer,
      psp,
      dao,
      pluginSetupRef,
      ethers.utils.defaultAbiCoder.encode(
        getNamedTypesFromMetadata(
          METADATA.build.pluginSetup.prepareInstallation.inputs
        ),
        [alice.address]
      )
    );

    const plugin = Admin__factory.connect(
      results.preparedEvent.args.plugin,
      deployer
    );

    // Check that the setup worked
    expect(await plugin.isMember(alice.address)).to.be.true;

    // Uninstall the current build.
    await uninstallPLugin(
      deployer,
      psp,
      dao,
      plugin,
      pluginSetupRef,
      ethers.utils.defaultAbiCoder.encode(
        getNamedTypesFromMetadata(
          METADATA.build.pluginSetup.prepareUninstallation.inputs
        ),
        []
      ),
      []
    );
  });
});

type FixtureResult = {
  deployer: SignerWithAddress;
  alice: SignerWithAddress;
  bob: SignerWithAddress;
  dao: DAO;
  psp: PluginSetupProcessor;
  pluginRepo: PluginRepo;
  pluginSetup: AdminSetup;
  pluginSetupRef: PluginSetupProcessorStructs.PluginSetupRefStruct;
};

async function fixture(): Promise<FixtureResult> {
  // Deploy all contracts
  const tags = ['CreateRepo', 'NewVersion'];
  await deployments.fixture(tags);

  const [deployer, alice, bob] = await ethers.getSigners();
  const dummyMetadata = ethers.utils.hexlify(
    ethers.utils.toUtf8Bytes('0x123456789')
  );
  const dao = await createDaoProxy(deployer, dummyMetadata);

  const network = getNetworkNameByAlias(productionNetworkName);
  if (network === null) {
    throw new UnsupportedNetworkError(productionNetworkName);
  }
  const networkDeployments = getLatestNetworkDeployment(network);
  if (networkDeployments === null) {
    throw `Deployments are not available on network ${network}.`;
  }

  // Get the `PluginSetupProcessor` from the network
  const psp = PluginSetupProcessor__factory.connect(
    networkDeployments.PluginSetupProcessor.address,
    deployer
  );

  // Get the deployed `PluginRepo`
  const {pluginRepo, ensDomain} = await findPluginRepo(env);
  if (pluginRepo === null) {
    throw `PluginRepo '${ensDomain}' does not exist yet.`;
  }

  const release = 1;
  const pluginSetup = AdminSetup__factory.connect(
    (await pluginRepo['getLatestVersion(uint8)'](release)).pluginSetup,
    deployer
  );

  const pluginSetupRef = {
    versionTag: {
      release: VERSION.release,
      build: VERSION.build,
    },
    pluginSetupRepo: pluginRepo.address,
  };

  return {
    deployer,
    alice,
    bob,
    psp,
    dao,
    pluginRepo,
    pluginSetup,
    pluginSetupRef,
  };
}
