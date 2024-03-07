import {METADATA, VERSION} from '../../plugin-settings';
import {MultisigSetup, Multisig__factory} from '../../typechain';
import {getProductionNetworkName, findPluginRepo} from '../../utils/helpers';
import {Multisig} from '../test-utils/typechain-versions';
import {
  createDaoProxy,
  installPLugin,
  uninstallPLugin,
  updateFromBuildTest,
} from './test-helpers';
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
  MultisigSetup__factory,
} from '@aragon/osx-ethers';
import {loadFixture} from '@nomicfoundation/hardhat-network-helpers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import env, {deployments, ethers} from 'hardhat';

const productionNetworkName = getProductionNetworkName(env);

type FixtureResult = {
  deployer: SignerWithAddress;
  alice: SignerWithAddress;
  bob: SignerWithAddress;
  dao: DAO;
  defaultInitData: {
    members: string[];
    settings: Multisig.MultisigSettingsStruct;
  };
  psp: PluginSetupProcessor;
  pluginRepo: PluginRepo;
  pluginSetup: MultisigSetup;
  pluginSetupRefLatestBuild: PluginSetupProcessorStructs.PluginSetupRefStruct;
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
  const pluginSetup = MultisigSetup__factory.connect(
    (await pluginRepo['getLatestVersion(uint8)'](release)).pluginSetup,
    deployer
  );

  const defaultInitData = {
    members: [alice.address],
    settings: {
      onlyListed: true,
      minApprovals: 1,
    },
  };

  const pluginSetupRefLatestBuild = {
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
    defaultInitData,
    pluginRepo,
    pluginSetup,
    pluginSetupRefLatestBuild,
  };
}

describe(`PluginSetup processing on network '${productionNetworkName}'`, function () {
  it('installs & uninstalls the current build', async () => {
    const {alice, bob, deployer, psp, dao, pluginSetupRefLatestBuild} =
      await loadFixture(fixture);

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
    const initialMembers = [alice.address, bob.address];
    const multisigSettings: Multisig.MultisigSettingsStruct = {
      onlyListed: true,
      minApprovals: 2,
    };

    const results = await installPLugin(
      deployer,
      psp,
      dao,
      pluginSetupRefLatestBuild,
      ethers.utils.defaultAbiCoder.encode(
        getNamedTypesFromMetadata(
          METADATA.build.pluginSetup.prepareInstallation.inputs
        ),
        [initialMembers, multisigSettings]
      )
    );

    const plugin = Multisig__factory.connect(
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
      pluginSetupRefLatestBuild,
      ethers.utils.defaultAbiCoder.encode(
        getNamedTypesFromMetadata(
          METADATA.build.pluginSetup.prepareUninstallation.inputs
        ),
        []
      ),
      []
    );
  });

  it('updates from build 1 to the current build', async () => {
    const {
      deployer,
      psp,
      dao,
      defaultInitData,
      pluginRepo,
      pluginSetupRefLatestBuild,
    } = await loadFixture(fixture);

    await updateFromBuildTest(
      dao,
      deployer,
      psp,
      pluginRepo,
      pluginSetupRefLatestBuild,
      1,
      [defaultInitData.members, Object.values(defaultInitData.settings)],
      []
    );
  });

  it('updates from build 2 to the current build', async () => {
    const {
      deployer,
      psp,
      dao,
      defaultInitData,
      pluginRepo,
      pluginSetupRefLatestBuild,
    } = await loadFixture(fixture);

    await updateFromBuildTest(
      dao,
      deployer,
      psp,
      pluginRepo,
      pluginSetupRefLatestBuild,
      2,
      [defaultInitData.members, Object.values(defaultInitData.settings)],
      []
    );
  });
});
