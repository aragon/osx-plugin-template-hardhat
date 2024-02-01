import {METADATA} from '../../plugin-settings';
import {
  DAOMock,
  DAOMock__factory,
  MyPluginSetup,
  MyPluginSetup__factory,
  MyPlugin__factory,
} from '../../typechain';
import {PluginSetupRefStruct} from '../../typechain/@aragon/osx/framework/dao/DAOFactory';
import {
  getProductionNetworkName,
  getAragonDeploymentsInfo,
} from '../../utils/helpers';
import {installPLugin, uninstallPLugin} from '../helpers/setup';
import {
  getLatestNetworkDeployment,
  getNetworkNameByAlias,
} from '@aragon/osx-commons-configs';
import {getNamedTypesFromMetadata} from '@aragon/osx-commons-sdk';
import {
  PluginRepo,
  PluginRepo__factory,
  PluginSetupProcessor,
  PluginSetupProcessor__factory,
} from '@aragon/osx-ethers';
import {loadFixture} from '@nomicfoundation/hardhat-network-helpers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {BigNumber} from 'ethers';
import env, {deployments, ethers} from 'hardhat';

const productionNetworkName = getProductionNetworkName(env);

describe(`PluginSetup processing on network '${productionNetworkName}'`, function () {
  context('Build 1', async () => {
    it('installs & uninstalls', async () => {
      const {deployer, psp, daoMock, pluginSetup, pluginSetupRef} =
        await loadFixture(fixture);

      // Allow all authorized calls to happen
      await daoMock.setHasPermissionReturnValueMock(true);

      // Install build 1.
      const results = await installPLugin(
        psp,
        daoMock,
        pluginSetupRef,
        ethers.utils.defaultAbiCoder.encode(
          getNamedTypesFromMetadata(
            METADATA.build.pluginSetup.prepareInstallation.inputs
          ),
          [123]
        )
      );

      const plugin = MyPlugin__factory.connect(
        results.preparedEvent.args.plugin,
        deployer
      );

      // Check implementation.
      expect(await plugin.implementation()).to.be.eq(
        await pluginSetup.implementation()
      );

      // Check state.
      expect(await plugin.number()).to.eq(123);

      // Uninstall build 1.
      await uninstallPLugin(
        psp,
        daoMock,
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
});

type FixtureResult = {
  deployer: SignerWithAddress;
  alice: SignerWithAddress;
  bob: SignerWithAddress;
  daoMock: DAOMock;
  psp: PluginSetupProcessor;
  pluginRepo: PluginRepo;
  pluginSetup: MyPluginSetup;
  pluginSetupRef: PluginSetupRefStruct;
};

async function fixture(): Promise<FixtureResult> {
  // Deploy all contracts
  const tags = ['CreateRepo', 'NewVersion'];
  await deployments.fixture(tags);

  const [deployer, alice, bob] = await ethers.getSigners();
  const daoMock = await new DAOMock__factory(deployer).deploy();

  // Get the `PluginSetupProcessor` from the network
  const psp = PluginSetupProcessor__factory.connect(
    getLatestNetworkDeployment(getNetworkNameByAlias(productionNetworkName)!)!
      .PluginSetupProcessor.address,
    deployer
  );

  // Get the deployed `PluginRepo`
  const network = env.network.name;
  const pluginRepo = PluginRepo__factory.connect(
    getAragonDeploymentsInfo(network)[network].address,
    deployer
  );

  const release = 1;
  const pluginSetup = MyPluginSetup__factory.connect(
    (await pluginRepo['getLatestVersion(uint8)'](release)).pluginSetup,
    deployer
  );

  const pluginSetupRef = {
    versionTag: {
      release: BigNumber.from(1),
      build: BigNumber.from(1),
    },
    pluginSetupRepo: pluginRepo.address,
  };

  return {
    deployer,
    alice,
    bob,
    psp,
    daoMock,
    pluginRepo,
    pluginSetup,
    pluginSetupRef,
  };
}
