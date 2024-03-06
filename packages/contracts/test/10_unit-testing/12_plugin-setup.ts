import {createDaoProxy} from '../20_integration-testing/test-helpers';
import buildMetadata from '../../src/build-metadata.json';
import {MultisigSetup, MultisigSetup__factory} from '../../typechain';
import {
  MULTISIG_INTERFACE,
  MultisigSettings,
  UPDATE_MULTISIG_SETTINGS_PERMISSION_ID,
} from '../multisig-constants';
import {Multisig__factory} from '../test-utils/typechain-versions';
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
  defaultMultisigSettings: MultisigSettings;
  prepareInstallationInputs: string;
  prepareUninstallationInputs: string;
  dao: DAO;
};

async function fixture(): Promise<FixtureResult> {
  const [deployer, alice, bob, carol] = await ethers.getSigners();

  const dummyMetadata = ethers.utils.hexlify(
    ethers.utils.toUtf8Bytes('0x123456789')
  );
  const dao = await createDaoProxy(deployer, dummyMetadata);
  const pluginSetup = await new MultisigSetup__factory(deployer).deploy();

  const defaultMembers = [alice.address, bob.address, carol.address];
  const defaultMultisigSettings: MultisigSettings = {
    onlyListed: true,
    minApprovals: 1,
  };

  const prepareInstallationInputs = ethers.utils.defaultAbiCoder.encode(
    getNamedTypesFromMetadata(
      buildMetadata.pluginSetup.prepareInstallation.inputs
    ),
    [defaultMembers, Object.values(defaultMultisigSettings)]
  );
  const prepareUninstallationInputs = ethers.utils.defaultAbiCoder.encode(
    getNamedTypesFromMetadata(
      buildMetadata.pluginSetup.prepareUninstallation.inputs
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

  it('creates multisig base with the correct interface', async () => {
    const {deployer, pluginSetup} = await loadFixture(fixture);

    const factory = new Multisig__factory(deployer);
    const multisigContract = factory.attach(await pluginSetup.implementation());

    expect(
      await multisigContract.supportsInterface(
        getInterfaceId(MULTISIG_INTERFACE)
      )
    ).to.be.true;
  });

  describe('prepareInstallation', async () => {
    it('fails if data is empty, or not of minimum length', async () => {
      const {pluginSetup, dao, prepareInstallationInputs} = await loadFixture(
        fixture
      );
      await expect(pluginSetup.prepareInstallation(dao.address, [])).to.be
        .reverted;

      const trimmedData = prepareInstallationInputs.substring(
        0,
        prepareInstallationInputs.length - 2
      );
      await expect(pluginSetup.prepareInstallation(dao.address, trimmedData)).to
        .be.reverted;

      await expect(
        pluginSetup.prepareInstallation(dao.address, prepareInstallationInputs)
      ).not.to.be.reverted;
    });

    it('reverts if zero members are provided in `_data`', async () => {
      const {deployer, pluginSetup, dao, defaultMultisigSettings} =
        await loadFixture(fixture);

      const noMembers: string[] = [];

      const wrongPrepareInstallationData = abiCoder.encode(
        getNamedTypesFromMetadata(
          buildMetadata.pluginSetup.prepareInstallation.inputs
        ),
        [noMembers, defaultMultisigSettings]
      );

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

      const multisigSettings: MultisigSettings = {
        onlyListed: true,
        minApprovals: 0,
      };
      const members = [deployer.address];

      const wrongPrepareInstallationData = abiCoder.encode(
        getNamedTypesFromMetadata(
          buildMetadata.pluginSetup.prepareInstallation.inputs
        ),
        [members, multisigSettings]
      );

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

      await expect(
        pluginSetup.prepareInstallation(
          dao.address,
          wrongPrepareInstallationData
        )
      )
        .to.be.revertedWithCustomError(multisig, 'MinApprovalsOutOfBounds')
        .withArgs(1, 0);
    });

    it('reverts if the `minApprovals` value in `_data` is greater than the number members', async () => {
      const {deployer, pluginSetup, dao} = await loadFixture(fixture);

      const multisigSettings: MultisigSettings = {
        onlyListed: true,
        minApprovals: 2,
      };
      const members = [deployer.address];

      const wrongPrepareInstallationData = abiCoder.encode(
        getNamedTypesFromMetadata(
          buildMetadata.pluginSetup.prepareInstallation.inputs
        ),
        [members, multisigSettings]
      );

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

      const nonce = await ethers.provider.getTransactionCount(
        pluginSetup.address
      );
      const anticipatedPluginAddress = ethers.utils.getContractAddress({
        from: pluginSetup.address,
        nonce,
      });

      const {
        plugin,
        preparedSetupData: {helpers, permissions},
      } = await pluginSetup.callStatic.prepareInstallation(
        dao.address,
        prepareInstallationInputs
      );

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

      const daoAddress = dao.address;

      const nonce = await ethers.provider.getTransactionCount(
        pluginSetup.address
      );
      const anticipatedPluginAddress = ethers.utils.getContractAddress({
        from: pluginSetup.address,
        nonce,
      });

      await pluginSetup.prepareInstallation(
        daoAddress,
        prepareInstallationInputs
      );

      const factory = new Multisig__factory(deployer);
      const multisigContract = factory.attach(anticipatedPluginAddress);

      expect(await multisigContract.dao()).to.eq(daoAddress);
      expect(await multisigContract.addresslistLength()).to.be.eq(
        defaultMembers.length
      );
      const settings = await multisigContract.multisigSettings();
      expect(settings.onlyListed).to.equal(defaultMultisigSettings.onlyListed);
      expect(settings.minApprovals).to.eq(defaultMultisigSettings.minApprovals);
    });
  });

  describe('prepareUpdate', async () => {
    it('should return nothing', async () => {
      const {pluginSetup, dao} = await loadFixture(fixture);

      const currentBuild = 3;
      const prepareUpdateData = await pluginSetup.callStatic.prepareUpdate(
        dao.address,
        currentBuild,
        {
          currentHelpers: [
            ethers.Wallet.createRandom().address,
            ethers.Wallet.createRandom().address,
          ],
          data: '0x00',
          plugin: ethers.Wallet.createRandom().address,
        }
      );
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

      const plugin = ethers.Wallet.createRandom().address;

      const permissions = await pluginSetup.callStatic.prepareUninstallation(
        dao.address,
        {
          plugin,
          currentHelpers: [],
          data: prepareUninstallationInputs,
        }
      );

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
