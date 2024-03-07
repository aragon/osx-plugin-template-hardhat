import {createDaoProxy} from '../20_integration-testing/test-helpers';
import {METADATA, VERSION} from '../../plugin-settings';
import {MultisigSetup, MultisigSetup__factory} from '../../typechain';
import {
  MULTISIG_INTERFACE,
  UPDATE_MULTISIG_SETTINGS_PERMISSION_ID,
} from '../multisig-constants';
import {Multisig__factory, Multisig} from '../test-utils/typechain-versions';
import {
  getInterfaceId,
  Operation,
  DAO_PERMISSIONS,
  PLUGIN_UUPS_UPGRADEABLE_PERMISSIONS,
  getNamedTypesFromMetadata,
} from '@aragon/osx-commons-sdk';
import {DAO} from '@aragon/osx-ethers';
import {loadFixture} from '@nomicfoundation/hardhat-network-helpers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {ethers} from 'hardhat';

const abiCoder = ethers.utils.defaultAbiCoder;
const AddressZero = ethers.constants.AddressZero;

type FixtureResult = {
  deployer: SignerWithAddress;
  alice: SignerWithAddress;
  bob: SignerWithAddress;
  carol: SignerWithAddress;
  pluginSetup: MultisigSetup;
  defaultMembers: string[];
  defaultMultisigSettings: Multisig.MultisigSettingsStruct;
  prepareInstallationInputs: string;
  prepareUninstallationInputs: string;
  dao: DAO;
};

async function fixture(): Promise<FixtureResult> {
  const [deployer, alice, bob, carol] = await ethers.getSigners();

  // Deploy a DAO proxy.
  const dummyMetadata = ethers.utils.hexlify(
    ethers.utils.toUtf8Bytes('0x123456789')
  );
  const dao = await createDaoProxy(deployer, dummyMetadata);

  // Deploy a plugin setup contract
  const pluginSetup = await new MultisigSetup__factory(deployer).deploy();

  // Provide default multisig settings
  const defaultMembers = [alice.address, bob.address, carol.address];
  const defaultMultisigSettings: Multisig.MultisigSettingsStruct = {
    onlyListed: true,
    minApprovals: 1,
  };

  // Provide installation inputs
  const prepareInstallationInputs = ethers.utils.defaultAbiCoder.encode(
    getNamedTypesFromMetadata(
      METADATA.build.pluginSetup.prepareInstallation.inputs
    ),
    [defaultMembers, Object.values(defaultMultisigSettings)]
  );

  // Provide uninstallation inputs
  const prepareUninstallationInputs = ethers.utils.defaultAbiCoder.encode(
    getNamedTypesFromMetadata(
      METADATA.build.pluginSetup.prepareUninstallation.inputs
    ),
    []
  );

  return {
    deployer,
    alice,
    bob,
    carol,
    pluginSetup,
    defaultMembers,
    defaultMultisigSettings,
    prepareInstallationInputs,
    prepareUninstallationInputs,
    dao,
  };
}

describe('MultisigSetup', function () {
  it('does not support the empty interface', async () => {
    const {pluginSetup} = await loadFixture(fixture);
    expect(await pluginSetup.supportsInterface('0xffffffff')).to.be.false;
  });

  it('has a multisig implementation supporting the correct interface', async () => {
    const {deployer, pluginSetup} = await loadFixture(fixture);

    const factory = new Multisig__factory(deployer);
    const multisigImplementation = factory.attach(
      await pluginSetup.implementation()
    );

    expect(
      await multisigImplementation.supportsInterface(
        getInterfaceId(MULTISIG_INTERFACE)
      )
    ).to.be.true;
  });

  describe('prepareInstallation', async () => {
    it('fails if data is empty, or not of minimum length', async () => {
      const {pluginSetup, dao, prepareInstallationInputs} = await loadFixture(
        fixture
      );

      // Try calling `prepareInstallation` without input data.
      await expect(pluginSetup.prepareInstallation(dao.address, [])).to.be
        .reverted;

      // Try calling `prepareInstallation` without input data of wrong length.
      const trimmedData = prepareInstallationInputs.substring(
        0,
        prepareInstallationInputs.length - 2
      );
      await expect(pluginSetup.prepareInstallation(dao.address, trimmedData)).to
        .be.reverted;

      // Check that `prepareInstallation` can be called with the correct input data.
      await expect(
        pluginSetup.prepareInstallation(dao.address, prepareInstallationInputs)
      ).not.to.be.reverted;
    });

    it('reverts if zero members are provided in the initialization data', async () => {
      const {deployer, pluginSetup, dao, defaultMultisigSettings} =
        await loadFixture(fixture);

      // Create input data containing an empty list of initial members.
      const noMembers: string[] = [];
      const wrongPrepareInstallationData = abiCoder.encode(
        getNamedTypesFromMetadata(
          METADATA.build.pluginSetup.prepareInstallation.inputs
        ),
        [noMembers, defaultMultisigSettings]
      );

      // Anticipate the plugin proxy address that will be deployed.
      const nonce = await ethers.provider.getTransactionCount(
        pluginSetup.address
      );
      const anticipatedPluginAddress = ethers.utils.getContractAddress({
        from: pluginSetup.address,
        nonce,
      });
      const multisig = Multisig__factory.connect(
        anticipatedPluginAddress,
        deployer
      );

      // Try calling `prepareInstallation`, which will fail during plugin initialization because of the empty initial
      // member list.
      await expect(
        pluginSetup.prepareInstallation(
          dao.address,
          wrongPrepareInstallationData
        )
      )
        .to.be.revertedWithCustomError(multisig, 'MinApprovalsOutOfBounds')
        .withArgs(0, 1);
    });

    it('reverts if the `minApprovals` value in `_data` is zero', async () => {
      const {deployer, pluginSetup, dao} = await loadFixture(fixture);

      // Create input data containing a `minApprovals` threshold of 0.
      const multisigSettings: Multisig.MultisigSettingsStruct = {
        onlyListed: true,
        minApprovals: 0,
      };
      const members = [deployer.address];
      const wrongPrepareInstallationData = abiCoder.encode(
        getNamedTypesFromMetadata(
          METADATA.build.pluginSetup.prepareInstallation.inputs
        ),
        [members, multisigSettings]
      );

      // Anticipate the plugin proxy address that will be deployed.
      const nonce = await ethers.provider.getTransactionCount(
        pluginSetup.address
      );
      const anticipatedPluginAddress = ethers.utils.getContractAddress({
        from: pluginSetup.address,
        nonce,
      });
      const multisig = Multisig__factory.connect(
        anticipatedPluginAddress,
        deployer
      );

      // Try calling `prepareInstallation`, which will fail during plugin initialization because of the invalid
      // `minApprovals` value.
      await expect(
        pluginSetup.prepareInstallation(
          dao.address,
          wrongPrepareInstallationData
        )
      )
        .to.be.revertedWithCustomError(multisig, 'MinApprovalsOutOfBounds')
        .withArgs(1, 0);
    });

    it('reverts if the `minApprovals` value in `_data` is greater than the number of members', async () => {
      const {deployer, pluginSetup, dao} = await loadFixture(fixture);

      // Create input data containing an initial member list with a length lower that the specified `minApprovals`
      // threshold.
      const multisigSettings: Multisig.MultisigSettingsStruct = {
        onlyListed: true,
        minApprovals: 2,
      };
      const members = [deployer.address];
      const wrongPrepareInstallationData = abiCoder.encode(
        getNamedTypesFromMetadata(
          METADATA.build.pluginSetup.prepareInstallation.inputs
        ),
        [members, multisigSettings]
      );

      // Anticipate the plugin proxy address that will be deployed.
      const nonce = await ethers.provider.getTransactionCount(
        pluginSetup.address
      );
      const anticipatedPluginAddress = ethers.utils.getContractAddress({
        from: pluginSetup.address,
        nonce,
      });
      const multisig = Multisig__factory.connect(
        anticipatedPluginAddress,
        deployer
      );

      // Try calling `prepareInstallation`, which will fail during plugin initialization because of the mismatch
      // between the `minApprovals` value and the initial member list length.
      await expect(
        pluginSetup.prepareInstallation(
          dao.address,
          wrongPrepareInstallationData
        )
      )
        .to.be.revertedWithCustomError(multisig, 'MinApprovalsOutOfBounds')
        .withArgs(members.length, multisigSettings.minApprovals);
    });

    it('returns the plugin, helpers, and permissions', async () => {
      const {pluginSetup, dao, prepareInstallationInputs} = await loadFixture(
        fixture
      );

      // Anticipate the plugin proxy address that will be deployed.
      const nonce = await ethers.provider.getTransactionCount(
        pluginSetup.address
      );
      const anticipatedPluginAddress = ethers.utils.getContractAddress({
        from: pluginSetup.address,
        nonce,
      });

      // Make a static call to check that the plugin preparation data being returned is correct.
      const {
        plugin,
        preparedSetupData: {helpers, permissions},
      } = await pluginSetup.callStatic.prepareInstallation(
        dao.address,
        prepareInstallationInputs
      );

      // Check the return data.
      expect(plugin).to.be.equal(anticipatedPluginAddress);
      expect(helpers.length).to.be.equal(0);
      expect(permissions.length).to.be.equal(3);
      expect(permissions).to.deep.equal([
        [
          Operation.Grant,
          plugin,
          dao.address,
          AddressZero,
          UPDATE_MULTISIG_SETTINGS_PERMISSION_ID,
        ],
        [
          Operation.Grant,
          plugin,
          dao.address,
          AddressZero,
          PLUGIN_UUPS_UPGRADEABLE_PERMISSIONS.UPGRADE_PLUGIN_PERMISSION_ID,
        ],
        [
          Operation.Grant,
          dao.address,
          plugin,
          AddressZero,
          DAO_PERMISSIONS.EXECUTE_PERMISSION_ID,
        ],
      ]);
    });

    it('sets up the plugin', async () => {
      const {
        deployer,
        pluginSetup,
        dao,
        prepareInstallationInputs,
        defaultMembers,
        defaultMultisigSettings,
      } = await loadFixture(fixture);

      // Anticipate the plugin proxy address that will be deployed.
      const nonce = await ethers.provider.getTransactionCount(
        pluginSetup.address
      );
      const anticipatedPluginAddress = ethers.utils.getContractAddress({
        from: pluginSetup.address,
        nonce,
      });

      // Prepare the installation
      await pluginSetup.prepareInstallation(
        dao.address,
        prepareInstallationInputs
      );

      const plugin = Multisig__factory.connect(
        anticipatedPluginAddress,
        deployer
      );

      // Check that the plugin is initialized correctly.
      expect(await plugin.dao()).to.eq(dao.address);
      expect(await plugin.addresslistLength()).to.be.eq(defaultMembers.length);
      const settings = await plugin.multisigSettings();
      expect(settings.onlyListed).to.equal(defaultMultisigSettings.onlyListed);
      expect(settings.minApprovals).to.eq(defaultMultisigSettings.minApprovals);
    });
  });

  describe('prepareUpdate', async () => {
    it('should return nothing', async () => {
      const {pluginSetup, dao} = await loadFixture(fixture);

      // Make a static call to check that the plugin update data being returned is correct.
      const prepareUpdateData = await pluginSetup.callStatic.prepareUpdate(
        dao.address,
        VERSION.build,
        {
          currentHelpers: [
            ethers.Wallet.createRandom().address,
            ethers.Wallet.createRandom().address,
          ],
          data: '0x00',
          plugin: ethers.Wallet.createRandom().address,
        }
      );
      // Check the return data.
      expect(prepareUpdateData.initData).to.be.eq('0x');
      expect(prepareUpdateData.preparedSetupData.permissions).to.be.eql([]);
      expect(prepareUpdateData.preparedSetupData.helpers).to.be.eql([]);
    });
  });

  describe('prepareUninstallation', async () => {
    it('correctly returns permissions', async () => {
      const {pluginSetup, dao, prepareUninstallationInputs} = await loadFixture(
        fixture
      );

      // Use a random address to prepare an uninstallation.
      // Note: Applying this uninstallation would fail because the PSP knows if the plugin was installed at some point.
      const plugin = ethers.Wallet.createRandom().address;

      // Make a static call to check that the plugin uninstallation data being returned is correct.
      const permissions = await pluginSetup.callStatic.prepareUninstallation(
        dao.address,
        {
          plugin,
          currentHelpers: [],
          data: prepareUninstallationInputs,
        }
      );

      // Check the return data.
      expect(permissions.length).to.be.equal(3);
      expect(permissions).to.deep.equal([
        [
          Operation.Revoke,
          plugin,
          dao.address,
          AddressZero,
          UPDATE_MULTISIG_SETTINGS_PERMISSION_ID,
        ],
        [
          Operation.Revoke,
          plugin,
          dao.address,
          AddressZero,
          PLUGIN_UUPS_UPGRADEABLE_PERMISSIONS.UPGRADE_PLUGIN_PERMISSION_ID,
        ],
        [
          Operation.Revoke,
          dao.address,
          plugin,
          AddressZero,
          DAO_PERMISSIONS.EXECUTE_PERMISSION_ID,
        ],
      ]);
    });
  });
});
