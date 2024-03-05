import {createDaoProxy} from '../20_integration-testing/test-helpers';
import {
  Addresslist__factory,
  IERC165Upgradeable__factory,
  IMembership__factory,
  IMultisig__factory,
  IPlugin__factory,
  IProposal__factory,
  IProtocolVersion__factory,
  ProxyFactory__factory,
} from '../../typechain';
import {ExecutedEvent} from '../../typechain/@aragon/osx-commons-contracts/src/dao/IDAO';
import {ProxyCreatedEvent} from '../../typechain/@aragon/osx-commons-contracts/src/utils/deployment/ProxyFactory';
import {
  ApprovedEvent,
  ProposalCreatedEvent,
  ProposalExecutedEvent,
} from '../../typechain/src/Multisig';
import {
  MULTISIG_EVENTS,
  MULTISIG_INTERFACE,
  MultisigSettings,
  UPDATE_MULTISIG_SETTINGS_PERMISSION_ID,
} from '../multisig-constants';
import {Multisig__factory, Multisig} from '../test-utils/typechain-versions';
import {
  getInterfaceId,
  proposalIdToBytes32,
  IDAO_EVENTS,
  IMEMBERSHIP_EVENTS,
  IPROPOSAL_EVENTS,
  findEvent,
  findEventTopicLog,
  TIME,
  DAO_PERMISSIONS,
} from '@aragon/osx-commons-sdk';
import {DAO, DAOStructs, DAO__factory} from '@aragon/osx-ethers';
import {loadFixture, time} from '@nomicfoundation/hardhat-network-helpers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {BigNumber} from 'ethers';
import {ethers} from 'hardhat';

describe('Multisig', function () {
  describe('initialize', async () => {
    it('reverts if trying to re-initialize', async () => {
      const {dao, initializedPlugin, defaultInitData} = await loadFixture(
        fixture
      );

      await expect(
        initializedPlugin.initialize(
          dao.address,
          defaultInitData.members,
          defaultInitData.settings
        )
      ).to.be.revertedWith('Initializable: contract is already initialized');
    });

    it('adds the initial addresses to the address list', async () => {
      const {
        dao,
        uninitializedPlugin: plugin,
        defaultInitData,
      } = await loadFixture(fixture);

      // Check that the uninitialized plugin has no members.
      expect(await plugin.addresslistLength()).to.equal(0);

      // Initialize the plugin.
      await plugin.initialize(
        dao.address,
        defaultInitData.members,
        defaultInitData.settings
      );

      // Check that all members from the init data have been listed as members.
      expect(await plugin.addresslistLength()).to.equal(
        defaultInitData.members.length
      );

      const promises = defaultInitData.members.map(member =>
        plugin.isListed(member)
      );
      (await Promise.all(promises)).forEach(isListedResult => {
        expect(isListedResult).to.be.true;
      });
    });

    it('should set the `minApprovals`', async () => {
      const {initializedPlugin, defaultInitData} = await loadFixture(fixture);
      expect(
        (await initializedPlugin.multisigSettings()).minApprovals
      ).to.be.eq(defaultInitData.settings.minApprovals);
    });

    it('should set `onlyListed`', async () => {
      const {initializedPlugin, defaultInitData} = await loadFixture(fixture);
      expect((await initializedPlugin.multisigSettings()).onlyListed).to.be.eq(
        defaultInitData.settings.onlyListed
      );
    });

    it('should emit `MultisigSettingsUpdated` during initialization', async () => {
      const {uninitializedPlugin, defaultInitData, dao} = await loadFixture(
        fixture
      );
      await expect(
        uninitializedPlugin.initialize(
          dao.address,
          defaultInitData.members,
          defaultInitData.settings
        )
      )
        .to.emit(uninitializedPlugin, MULTISIG_EVENTS.MultisigSettingsUpdated)
        .withArgs(
          defaultInitData.settings.onlyListed,
          defaultInitData.settings.minApprovals
        );
    });

    it('should revert if members list is longer than uint16 max', async () => {
      const {uninitializedPlugin, alice, defaultInitData, dao} =
        await loadFixture(fixture);

      const overflowingMemberList = new Array(65536).fill(alice.address);
      await expect(
        uninitializedPlugin.initialize(
          dao.address,
          overflowingMemberList,
          defaultInitData.settings,
          {
            gasLimit: BigNumber.from(10).pow(8).toNumber(),
          }
        )
      )
        .to.revertedWithCustomError(
          uninitializedPlugin,
          'AddresslistLengthOutOfBounds'
        )
        .withArgs(65535, overflowingMemberList.length);
    });
  });

  describe('ERC-165', async () => {
    it('does not support the empty interface', async () => {
      const {initializedPlugin: plugin} = await loadFixture(fixture);
      expect(await plugin.supportsInterface('0xffffffff')).to.be.false;
    });

    it('supports the `IERC165Upgradeable` interface', async () => {
      const {initializedPlugin: plugin} = await loadFixture(fixture);
      const iface = IERC165Upgradeable__factory.createInterface();
      expect(await plugin.supportsInterface(getInterfaceId(iface))).to.be.true;
    });

    it('supports the `IPlugin` interface', async () => {
      const {initializedPlugin: plugin} = await loadFixture(fixture);
      const iface = IPlugin__factory.createInterface();
      expect(await plugin.supportsInterface(getInterfaceId(iface))).to.be.true;
    });

    it('supports the `IProtocolVersion` interface', async () => {
      const {initializedPlugin: plugin} = await loadFixture(fixture);
      const iface = IProtocolVersion__factory.createInterface();
      expect(await plugin.supportsInterface(getInterfaceId(iface))).to.be.true;
    });

    it('supports the `IProposal` interface', async () => {
      const {initializedPlugin: plugin} = await loadFixture(fixture);
      const iface = IProposal__factory.createInterface();
      expect(await plugin.supportsInterface(getInterfaceId(iface))).to.be.true;
    });

    it('supports the `IMembership` interface', async () => {
      const {initializedPlugin: plugin} = await loadFixture(fixture);
      const iface = IMembership__factory.createInterface();
      expect(await plugin.supportsInterface(getInterfaceId(iface))).to.be.true;
    });

    it('supports the `Addresslist` interface', async () => {
      const {initializedPlugin: plugin} = await loadFixture(fixture);
      const iface = Addresslist__factory.createInterface();
      expect(await plugin.supportsInterface(getInterfaceId(iface))).to.be.true;
    });

    it('supports the `IMultisig` interface', async () => {
      const {initializedPlugin: plugin} = await loadFixture(fixture);
      const iface = IMultisig__factory.createInterface();
      expect(await plugin.supportsInterface(getInterfaceId(iface))).to.be.true;
    });

    it('supports the `Multisig` interface', async () => {
      const {initializedPlugin: plugin} = await loadFixture(fixture);
      const interfaceId = getInterfaceId(MULTISIG_INTERFACE);
      expect(await plugin.supportsInterface(interfaceId)).to.be.true;
    });
  });

  describe('updateMultisigSettings', async () => {
    it('reverts if the caller misses the `UPDATE_MULTISIG_SETTINGS_PERMISSION` permission', async () => {
      const {
        alice,
        initializedPlugin: plugin,
        dao,
      } = await loadFixture(fixture);

      // Check that the Alice hasn't `UPDATE_MULTISIG_SETTINGS_PERMISSION_ID` permission on the Multisig plugin.
      expect(
        await dao.hasPermission(
          plugin.address,
          alice.address,
          UPDATE_MULTISIG_SETTINGS_PERMISSION_ID,
          []
        )
      ).to.be.false;

      // Expect Alice's `updateMultisigSettings` call to be reverted because she hasn't `UPDATE_MULTISIG_SETTINGS_PERMISSION_ID`
      // permission on the Multisig plugin.
      const newSettings: MultisigSettings = {
        onlyListed: false,
        minApprovals: 1,
      };
      await expect(plugin.connect(alice).updateMultisigSettings(newSettings))
        .to.be.revertedWithCustomError(plugin, 'DaoUnauthorized')
        .withArgs(
          dao.address,
          plugin.address,
          alice.address,
          UPDATE_MULTISIG_SETTINGS_PERMISSION_ID
        );
    });

    it('should not allow to set minApprovals larger than the address list length', async () => {
      const {
        alice,
        initializedPlugin: plugin,
        dao,
      } = await loadFixture(fixture);

      // Grant alice the permission to update settings.
      await dao.grant(
        plugin.address,
        alice.address,
        UPDATE_MULTISIG_SETTINGS_PERMISSION_ID
      );

      const addresslistLength = (await plugin.addresslistLength()).toNumber();

      const badSettings: MultisigSettings = {
        onlyListed: true,
        minApprovals: addresslistLength + 1,
      };

      await expect(plugin.connect(alice).updateMultisigSettings(badSettings))
        .to.be.revertedWithCustomError(plugin, 'MinApprovalsOutOfBounds')
        .withArgs(addresslistLength, badSettings.minApprovals);
    });

    it('should not allow to set `minApprovals` to 0', async () => {
      const {
        alice,
        initializedPlugin: plugin,
        dao,
      } = await loadFixture(fixture);

      // Grant alice the permission to update settings.
      await dao.grant(
        plugin.address,
        alice.address,
        UPDATE_MULTISIG_SETTINGS_PERMISSION_ID
      );

      // Update the settings with alice.
      const badSettings: MultisigSettings = {
        onlyListed: true,
        minApprovals: 0,
      };

      await expect(plugin.connect(alice).updateMultisigSettings(badSettings))
        .to.be.revertedWithCustomError(plugin, 'MinApprovalsOutOfBounds')
        .withArgs(1, 0);
    });

    it('should emit `MultisigSettingsUpdated` when `updateMultisigSettings` gets called', async () => {
      const {
        alice,
        initializedPlugin: plugin,
        defaultInitData,
        dao,
      } = await loadFixture(fixture);

      // Grant alice the permission to update settings.
      await dao.grant(
        plugin.address,
        alice.address,
        UPDATE_MULTISIG_SETTINGS_PERMISSION_ID
      );

      // Update the settings with alice.
      await expect(
        plugin.connect(alice).updateMultisigSettings(defaultInitData.settings)
      )
        .to.emit(plugin, MULTISIG_EVENTS.MultisigSettingsUpdated)
        .withArgs(
          defaultInitData.settings.onlyListed,
          defaultInitData.settings.minApprovals
        );
    });
  });

  describe('isListed', async () => {
    it('should return false, if a user is not listed', async () => {
      const {ivan, initializedPlugin: plugin} = await loadFixture(fixture);
      expect(await plugin.isListed(ivan.address)).to.equal(false);
    });
  });

  describe('isMember', async () => {
    it('should return false, if user is not listed', async () => {
      const {ivan, initializedPlugin: plugin} = await loadFixture(fixture);
      expect(await plugin.isMember(ivan.address)).to.be.false;
    });

    it('should return true if user is in the latest list', async () => {
      // TODO does this make sense?
      const {alice, initializedPlugin: plugin} = await loadFixture(fixture);
      expect(await plugin.isMember(alice.address)).to.be.true;
    });
  });

  describe('addAddresses', async () => {
    it('reverts if the caller misses the `UPDATE_MULTISIG_SETTINGS_PERMISSION_ID` permission', async () => {
      const {
        alice,
        dave,
        eve,
        initializedPlugin: plugin,
        dao,
      } = await loadFixture(fixture);

      // Check that the Alice hasn't `UPDATE_MULTISIG_SETTINGS_PERMISSION_ID` permission on the Multisig plugin.
      expect(
        await dao.hasPermission(
          plugin.address,
          alice.address,
          UPDATE_MULTISIG_SETTINGS_PERMISSION_ID,
          []
        )
      ).to.be.false;

      // Expect Alice's `addAddresses` call to be reverted because she hasn't `UPDATE_MULTISIG_SETTINGS_PERMISSION_ID`
      // permission on the Multisig plugin.
      await expect(
        plugin.connect(alice).addAddresses([dave.address, eve.address])
      )
        .to.be.revertedWithCustomError(plugin, 'DaoUnauthorized')
        .withArgs(
          dao.address,
          plugin.address,
          alice.address,
          UPDATE_MULTISIG_SETTINGS_PERMISSION_ID
        );
    });

    it('should add new members to the address list and emit the `MembersAdded` event', async () => {
      const {
        alice,
        dave,
        eve,
        initializedPlugin: plugin,
        dao,
      } = await loadFixture(fixture);

      // Grant alice the permission to update settings.
      await dao.grant(
        plugin.address,
        alice.address,
        UPDATE_MULTISIG_SETTINGS_PERMISSION_ID
      );

      // Check that dave and eve are not listed yet.
      expect(await plugin.isListed(dave.address)).to.equal(false);
      expect(await plugin.isListed(eve.address)).to.equal(false);

      // Call `addAddresses` with alice to add dave and eve.
      await expect(
        plugin.connect(alice).addAddresses([dave.address, eve.address])
      )
        .to.emit(plugin, IMEMBERSHIP_EVENTS.MembersAdded)
        .withArgs([dave.address, eve.address]);

      expect(await plugin.isListed(dave.address)).to.equal(true);
      expect(await plugin.isListed(eve.address)).to.equal(true);
    });
  });

  describe('removeAddresses', async () => {
    it('reverts if the caller misses the `UPDATE_MULTISIG_SETTINGS_PERMISSION_ID` permission', async () => {
      const {
        alice,
        bob,
        carol,
        initializedPlugin: plugin,
        dao,
      } = await loadFixture(fixture);

      // Check that Alice hasn't `UPDATE_MULTISIG_SETTINGS_PERMISSION_ID` permission on the Multisig plugin.
      expect(
        await dao.hasPermission(
          plugin.address,
          alice.address,
          UPDATE_MULTISIG_SETTINGS_PERMISSION_ID,
          []
        )
      ).to.be.false;

      // Expect Alice's `removeAddresses` call to be reverted because she hasn't `UPDATE_MULTISIG_SETTINGS_PERMISSION_ID`
      // permission on the Multisig plugin.
      await expect(
        plugin.connect(alice).removeAddresses([bob.address, carol.address])
      )
        .to.be.revertedWithCustomError(plugin, 'DaoUnauthorized')
        .withArgs(
          dao.address,
          plugin.address,
          alice.address,
          UPDATE_MULTISIG_SETTINGS_PERMISSION_ID
        );
    });

    it('should remove users from the address list and emit the `MembersRemoved` event', async () => {
      const {
        alice,
        bob,
        carol,
        initializedPlugin: plugin,
        dao,
      } = await loadFixture(fixture);

      // Grant alice the permission to update settings.
      await dao.grant(
        plugin.address,
        alice.address,
        UPDATE_MULTISIG_SETTINGS_PERMISSION_ID
      );

      // Check that alice, bob, and carol are listed
      expect(await plugin.isListed(alice.address)).to.equal(true);
      expect(await plugin.isListed(bob.address)).to.equal(true);
      expect(await plugin.isListed(carol.address)).to.equal(true);

      // Call `removeAddresses` with alice to remove bob.
      await expect(plugin.connect(alice).removeAddresses([bob.address])) // TODO Use larger member list
        .to.emit(plugin, IMEMBERSHIP_EVENTS.MembersRemoved)
        .withArgs([bob.address]);

      // Check that bob is removed while alice and carol remains listed.
      expect(await plugin.isListed(alice.address)).to.equal(true);
      expect(await plugin.isListed(bob.address)).to.equal(false);
      expect(await plugin.isListed(carol.address)).to.equal(true);
    });

    it('reverts if the address list would become empty', async () => {
      const {
        alice,
        initializedPlugin: plugin,
        defaultInitData,
        dao,
      } = await loadFixture(fixture);

      // Grant alice the permission to update settings.
      await dao.grant(
        plugin.address,
        alice.address,
        UPDATE_MULTISIG_SETTINGS_PERMISSION_ID
      );

      await expect(
        plugin.connect(alice).removeAddresses(defaultInitData.members)
      )
        .to.be.revertedWithCustomError(plugin, 'MinApprovalsOutOfBounds')
        .withArgs(
          0, //(await plugin.addresslistLength()).sub(1),
          defaultInitData.settings.minApprovals
        );
    });

    it('reverts if the address list would become shorter than the current minimum approval parameter requires', async () => {
      const {
        alice,
        carol,
        initializedPlugin: plugin,
        defaultInitData,
        dao,
      } = await loadFixture(fixture);

      // Grant alice the permission to update settings.
      await dao.grant(
        plugin.address,
        alice.address,
        UPDATE_MULTISIG_SETTINGS_PERMISSION_ID
      );

      await expect(plugin.connect(alice).removeAddresses([carol.address])).not
        .to.be.reverted;

      await expect(plugin.connect(alice).removeAddresses([alice.address]))
        .to.be.revertedWithCustomError(plugin, 'MinApprovalsOutOfBounds')
        .withArgs(
          (await plugin.addresslistLength()).sub(1),
          defaultInitData.settings.minApprovals
        );
    });
  });

  describe('createProposal', async () => {
    it('increments the proposal counter', async () => {
      const {
        alice,
        initializedPlugin: plugin,
        dummyMetadata,
        dummyActions,
      } = await loadFixture(fixture);

      expect(await plugin.proposalCount()).to.equal(0);

      const endDate = (await time.latest()) + TIME.HOUR;

      await expect(
        plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          )
      ).not.to.be.reverted;

      expect(await plugin.proposalCount()).to.equal(1);
    });

    it('creates unique proposal IDs for each proposal', async () => {
      const {
        alice,
        initializedPlugin: plugin,
        dummyMetadata,
        dummyActions,
      } = await loadFixture(fixture);

      const endDate = (await time.latest()) + TIME.HOUR;

      const proposalId0 = await plugin
        .connect(alice)
        .callStatic.createProposal(
          dummyMetadata,
          dummyActions,
          0,
          false,
          false,
          0,
          endDate
        );

      // create a new proposal for the proposalCounter to be incremented
      await expect(
        plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          )
      ).not.to.be.reverted;

      const proposalId1 = await plugin
        .connect(alice)
        .callStatic.createProposal(
          dummyMetadata,
          dummyActions,
          0,
          false,
          false,
          0,
          endDate
        );

      expect(proposalId0).to.equal(0);
      expect(proposalId1).to.equal(1);

      expect(proposalId0).to.not.equal(proposalId1);
    });

    it('emits the `ProposalCreated` event', async () => {
      const {
        alice,
        initializedPlugin: plugin,
        dummyMetadata,
      } = await loadFixture(fixture);

      const startDate = (await time.latest()) + TIME.MINUTE;
      const endDate = startDate + TIME.HOUR;

      const allowFailureMap = 1;

      const expectedProposalId = 0;

      await expect(
        plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            [],
            allowFailureMap,
            false,
            false,
            startDate,
            endDate
          )
      )
        .to.emit(plugin, IPROPOSAL_EVENTS.ProposalCreated)
        .withArgs(
          expectedProposalId,
          alice.address,
          startDate,
          endDate,
          dummyMetadata,
          [],
          allowFailureMap
        );
    });

    it('reverts if the multisig settings have been changed in the same block', async () => {
      const {
        alice,
        initializedPlugin: plugin,
        dao,
      } = await loadFixture(fixture);

      // Grant Alice the permission to update the settings.
      await dao.grant(
        plugin.address,
        alice.address,
        UPDATE_MULTISIG_SETTINGS_PERMISSION_ID
      );

      const newSettings = {
        onlyListed: false,
        minApprovals: 1,
      };

      /* Make two calls to update the settings in the same block. */
      // Disable auto-mining so that both proposals end up in the same block.
      await ethers.provider.send('evm_setAutomine', [false]);
      // Update #1
      await expect(plugin.connect(alice).updateMultisigSettings(newSettings));
      // Update #2
      await expect(plugin.connect(alice).updateMultisigSettings(newSettings));
      // Re-enable auto-mining so that the remaining tests run normally.
      await ethers.provider.send('evm_setAutomine', [true]);
    });

    it('reverts if the multisig settings have been changed in the same block via the proposals process', async () => {
      const {
        alice,
        uninitializedPlugin: plugin,
        dummyMetadata,
        dao,
      } = await loadFixture(fixture);
      await plugin.initialize(dao.address, [alice.address], {
        onlyListed: true,
        minApprovals: 1,
      });

      const startDate = (await time.latest()) + TIME.MINUTE;
      const endDate = startDate + TIME.HOUR;

      // Grant permissions between the DAO and the plugin.
      await dao.grant(
        plugin.address,
        dao.address,
        UPDATE_MULTISIG_SETTINGS_PERMISSION_ID
      );
      await dao.grant(
        dao.address,
        plugin.address,
        DAO_PERMISSIONS.EXECUTE_PERMISSION_ID
      );

      // Create an action calling `updateMultisigSettings`.
      const updateMultisigSettingsAction = {
        to: plugin.address,
        value: 0,
        data: plugin.interface.encodeFunctionData('updateMultisigSettings', [
          {
            onlyListed: false,
            minApprovals: 1,
          },
        ]),
      };

      /* Create two proposals to update the settings in the same block. */

      // Disable auto-mining so that both proposals end up in the same block.
      await ethers.provider.send('evm_setAutomine', [false]);

      // Create and execute proposal #1 calling `updateMultisigSettings`.
      await plugin.connect(alice).createProposal(
        dummyMetadata,
        [updateMultisigSettingsAction],
        0,
        true, // approve
        true, // execute
        0,
        endDate
      );

      // Try to call update the settings a second time.
      await expect(
        plugin.connect(alice).createProposal(
          dummyMetadata,
          [updateMultisigSettingsAction],
          0,
          false, // approve
          false, // execute
          0,
          endDate
        )
      )
        .to.revertedWithCustomError(plugin, 'ProposalCreationForbidden')
        .withArgs(alice.address);

      // Re-enable auto-mining so that the remaining tests run normally.
      await ethers.provider.send('evm_setAutomine', [true]);
    });

    describe('`onlyListed` is set to `false`', async () => {
      it('creates a proposal when an unlisted accounts is calling', async () => {
        const {
          alice,
          dave,
          initializedPlugin: plugin,
          dao,
          dummyMetadata,
        } = await loadFixture(fixture);

        await dao.grant(
          plugin.address,
          alice.address,
          UPDATE_MULTISIG_SETTINGS_PERMISSION_ID
        );

        await plugin.connect(alice).updateMultisigSettings({
          minApprovals: 2,
          onlyListed: false,
        });

        const startDate = (await time.latest()) + TIME.MINUTE;
        const endDate = startDate + TIME.HOUR;

        const expectedProposalId = 0;

        await expect(
          plugin
            .connect(dave) // not listed
            .createProposal(
              dummyMetadata,
              [],
              0,
              false,
              false,
              startDate,
              endDate
            )
        )
          .to.emit(plugin, IPROPOSAL_EVENTS.ProposalCreated)
          .withArgs(
            expectedProposalId,
            dave.address,
            startDate,
            endDate,
            dummyMetadata,
            [],
            0
          );
      });
    });

    describe('`onlyListed` is set to `true`', async () => {
      it('reverts if the user is not on the list and only listed accounts can create proposals', async () => {
        const {
          dave,
          initializedPlugin: plugin,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const endDate = (await time.latest()) + TIME.HOUR;

        await expect(
          plugin
            .connect(dave) // not listed
            .createProposal(
              dummyMetadata,
              dummyActions,
              0,
              false,
              false,
              0,
              endDate
            )
        )
          .to.be.revertedWithCustomError(plugin, 'ProposalCreationForbidden')
          .withArgs(dave.address);
      });

      it('reverts if `_msgSender` is not listed in the current block although he was listed in the last block', async () => {
        const {
          alice,
          carol,
          dave,
          initializedPlugin: plugin,
          dao,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const startDate = (await time.latest()) + TIME.MINUTE;
        const endDate = startDate + TIME.HOUR;

        await dao.grant(
          plugin.address,
          alice.address,
          UPDATE_MULTISIG_SETTINGS_PERMISSION_ID
        );

        // Disable auto-mining so that all subsequent transactions end up in the same block.
        await ethers.provider.send('evm_setAutomine', [false]);
        const expectedSnapshotBlockNumber = (
          await ethers.provider.getBlock('latest')
        ).number;

        // Transaction 1 & 2: Add Dave and remove Carol.
        const tx1 = await plugin.connect(alice).addAddresses([dave.address]);
        const tx2 = await plugin
          .connect(alice)
          .removeAddresses([carol.address]);

        // Transaction 3: Expect the proposal creation to fail for Carol because she was removed as a member in transaction 2.
        await expect(
          plugin
            .connect(carol)
            .createProposal(
              dummyMetadata,
              dummyActions,
              0,
              false,
              false,
              0,
              endDate
            )
        )
          .to.be.revertedWithCustomError(plugin, 'ProposalCreationForbidden')
          .withArgs(carol.address);

        const id = 0;

        // Transaction 4: Create the proposal as Dave
        const tx4 = await plugin
          .connect(dave)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            startDate
          );

        // Check the listed members before the block is mined
        expect(await plugin.isListed(carol.address)).to.equal(true);
        expect(await plugin.isListed(dave.address)).to.equal(false);

        // Mine the block
        await ethers.provider.send('evm_mine', []);
        const minedBlockNumber = (await ethers.provider.getBlock('latest'))
          .number;

        // Expect all transaction receipts to be in the same block after the snapshot block.
        expect((await tx1.wait()).blockNumber).to.equal(minedBlockNumber);
        expect((await tx2.wait()).blockNumber).to.equal(minedBlockNumber);
        expect((await tx4.wait()).blockNumber).to.equal(minedBlockNumber);
        expect(minedBlockNumber).to.equal(expectedSnapshotBlockNumber + 1);

        // Expect the listed member to have changed
        expect(await plugin.isListed(carol.address)).to.equal(false);
        expect(await plugin.isListed(dave.address)).to.equal(true);

        // Check the `ProposalCreatedEvent` for the creator and proposalId
        const event = await findEvent<ProposalCreatedEvent>(
          tx4,
          'ProposalCreated'
        );
        expect(event.args.proposalId).to.equal(id);
        expect(event.args.creator).to.equal(dave.address);

        // Check that the snapshot block stored in the proposal struct
        const proposal = await plugin.getProposal(id);
        expect(proposal.parameters.snapshotBlock).to.equal(
          expectedSnapshotBlockNumber
        );

        // Re-enable auto-mining so that the remaining tests run normally.
        await ethers.provider.send('evm_setAutomine', [true]);
      });

      it('creates a proposal successfully and does not approve if not specified', async () => {
        const {
          alice,
          bob,
          initializedPlugin: plugin,
          defaultInitData,
          dummyMetadata,
        } = await loadFixture(fixture);

        const startDate = (await time.latest()) + TIME.MINUTE;
        const endDate = startDate + TIME.HOUR;

        await time.setNextBlockTimestamp(startDate);

        const id = 0;
        await expect(
          plugin
            .connect(alice)
            .createProposal(
              dummyMetadata,
              [],
              0,
              false,
              false,
              startDate,
              endDate
            )
        )
          .to.emit(plugin, IPROPOSAL_EVENTS.ProposalCreated)
          .withArgs(
            id,
            alice.address,
            startDate,
            endDate,
            dummyMetadata,
            [],
            0
          );

        const block = await ethers.provider.getBlock('latest');

        const proposal = await plugin.getProposal(id);
        expect(proposal.executed).to.equal(false);
        expect(proposal.allowFailureMap).to.equal(0);
        expect(proposal.parameters.snapshotBlock).to.equal(block.number - 1);
        expect(proposal.parameters.minApprovals).to.equal(
          defaultInitData.settings.minApprovals
        );

        expect(proposal.parameters.startDate).to.equal(startDate);
        expect(proposal.parameters.endDate).to.equal(endDate);
        expect(proposal.actions.length).to.equal(0);
        expect(proposal.approvals).to.equal(0);

        expect(await plugin.canApprove(id, alice.address)).to.be.true;
        expect(await plugin.canApprove(id, bob.address)).to.be.true;
      });

      it('creates a proposal successfully and approves if specified', async () => {
        const {
          alice,
          bob,
          initializedPlugin: plugin,
          defaultInitData,
          dummyMetadata,
        } = await loadFixture(fixture);

        const startDate = (await time.latest()) + TIME.MINUTE;
        const endDate = startDate + TIME.HOUR;
        const allowFailureMap = 1;

        await time.setNextBlockTimestamp(startDate);

        const id = 0;
        await expect(
          plugin
            .connect(alice)
            .createProposal(
              dummyMetadata,
              [],
              allowFailureMap,
              true,
              false,
              startDate,
              endDate
            )
        )
          .to.emit(plugin, IPROPOSAL_EVENTS.ProposalCreated)
          .withArgs(
            id,
            alice.address,
            startDate,
            endDate,
            dummyMetadata,
            [],
            allowFailureMap
          )
          .to.emit(plugin, MULTISIG_EVENTS.Approved)
          .withArgs(id, alice.address);

        const block = await ethers.provider.getBlock('latest');

        const proposal = await plugin.getProposal(id);
        expect(proposal.executed).to.equal(false);
        expect(proposal.allowFailureMap).to.equal(allowFailureMap);
        expect(proposal.parameters.snapshotBlock).to.equal(block.number - 1);
        expect(proposal.parameters.minApprovals).to.equal(
          defaultInitData.settings.minApprovals
        );
        expect(proposal.parameters.startDate).to.equal(startDate);
        expect(proposal.parameters.endDate).to.equal(endDate);
        expect(proposal.actions.length).to.equal(0);
        expect(proposal.approvals).to.equal(1);

        expect(await plugin.canApprove(id, alice.address)).to.be.false;
        expect(await plugin.canApprove(id, bob.address)).to.be.true;
      });

      it('increases the proposal count', async () => {
        const {
          alice,
          initializedPlugin: plugin,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const startDate = (await time.latest()) + TIME.MINUTE;
        const endDate = startDate + TIME.HOUR;

        expect(await plugin.proposalCount()).to.equal(0);

        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        expect(await plugin.proposalCount()).to.equal(1);

        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        expect(await plugin.proposalCount()).to.equal(2);
      });
    });

    it('should revert if startDate is < than now', async () => {
      const {
        alice,
        initializedPlugin: plugin,
        dummyMetadata,
        dummyActions,
      } = await loadFixture(fixture);

      const startDate = (await time.latest()) + TIME.MINUTE;
      const startDateInThePast = startDate - 1;
      const endDate = 0; // startDate + minDuration // TODO use elsewhere

      await time.setNextBlockTimestamp(startDate);

      await expect(
        plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            true,
            false,
            startDateInThePast,
            endDate
          )
      )
        .to.be.revertedWithCustomError(plugin, 'DateOutOfBounds')
        .withArgs(
          startDate, // await takes one second
          startDateInThePast
        );
    });

    it('should revert if endDate is < than startDate', async () => {
      const {
        alice,
        initializedPlugin: plugin,
        dummyMetadata,
        dummyActions,
      } = await loadFixture(fixture);

      const startDate = (await time.latest()) + TIME.MINUTE;
      const endDate = startDate - 1; // endDate < startDate

      await expect(
        plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            true,
            false,
            startDate,
            endDate
          )
      )
        .to.be.revertedWithCustomError(plugin, 'DateOutOfBounds')
        .withArgs(startDate, endDate);
    });
  });

  context('Approving and executing proposals', async () => {
    describe('canApprove', async () => {
      it('returns `false` if the proposal is already executed', async () => {
        const {
          alice,
          bob,
          carol,
          initializedPlugin: plugin,
          dao,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const endDate = (await time.latest()) + TIME.HOUR;

        // Create a proposal (with ID 0)
        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        const id = 0;

        await dao.grant(
          dao.address,
          plugin.address,
          DAO_PERMISSIONS.EXECUTE_PERMISSION_ID
        );

        // Check that Carol can approve.
        expect(await plugin.canApprove(id, carol.address)).to.be.true;

        // Approve with Alice.
        await plugin.connect(alice).approve(id, false);
        // Approve and execute with Bob.
        await plugin.connect(bob).approve(id, true);

        // Check that the proposal got executed.
        expect((await plugin.getProposal(id)).executed).to.be.true;

        // Check that carol cannot approve the executed proposal anymore.
        expect(await plugin.canApprove(id, carol.address)).to.be.false;
      });

      it('returns `false` if the approver is not listed', async () => {
        const {
          alice,
          dave,
          initializedPlugin: plugin,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const endDate = (await time.latest()) + TIME.HOUR;

        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        const id = 0;

        expect(await plugin.isListed(dave.address)).to.be.false;
        expect(await plugin.canApprove(id, dave.address)).to.be.false;
      });

      it('returns `false` if the approver has already approved', async () => {
        const {
          alice,
          initializedPlugin: plugin,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const endDate = (await time.latest()) + TIME.HOUR;

        // Create a proposal (with ID 0)
        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        const id = 0;

        await plugin.connect(alice).approve(id, false);
        expect(await plugin.canApprove(id, alice.address)).to.be.false;
      });

      it('returns `true` if the approver is listed', async () => {
        const {
          alice,
          initializedPlugin: plugin,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const endDate = (await time.latest()) + TIME.HOUR;

        // Create a proposal (with ID 0)
        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        const id = 0;

        expect(await plugin.canApprove(id, alice.address)).to.be.true;
      });

      it("returns `false` if the proposal hasn't started yet", async () => {
        const {
          alice,
          initializedPlugin: plugin,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const startDate = (await time.latest()) + TIME.MINUTE;
        const endDate = startDate + TIME.HOUR;

        // Create a proposal (with ID 0)
        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            startDate,
            endDate
          );
        const id = 0;

        expect(await plugin.canApprove(id, alice.address)).to.be.false;

        await time.increaseTo(startDate);

        expect(await plugin.canApprove(id, alice.address)).to.be.true;
      });

      it('returns `false` if the proposal has ended', async () => {
        const {
          alice,
          initializedPlugin: plugin,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const endDate = (await time.latest()) + TIME.HOUR;

        // Create a proposal (with ID 0)
        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        const id = 0;

        expect(await plugin.canApprove(id, alice.address)).to.be.true;

        await time.increaseTo(endDate + 1);

        expect(await plugin.canApprove(id, alice.address)).to.be.false;
      });
    });

    describe('hasApproved', async () => {
      it("returns `false` if user hasn't approved yet", async () => {
        const {
          alice,
          initializedPlugin: plugin,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const endDate = (await time.latest()) + TIME.HOUR;

        // Create a proposal (with ID 0)
        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        const id = 0;

        expect(await plugin.hasApproved(id, alice.address)).to.be.false;
      });

      it('returns `true` if user has approved', async () => {
        const {
          alice,
          initializedPlugin: plugin,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const endDate = (await time.latest()) + TIME.HOUR;

        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        const id = 0;

        await plugin.connect(alice).approve(id, false);
        expect(await plugin.hasApproved(id, alice.address)).to.be.true;
      });
    });

    describe('approve', async () => {
      it('reverts when approving multiple times', async () => {
        const {
          alice,
          initializedPlugin: plugin,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const endDate = (await time.latest()) + TIME.HOUR;

        // Create a proposal (with ID 0)
        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        const id = 0;

        await plugin.connect(alice).approve(id, true);

        // Try to vote again
        await expect(plugin.connect(alice).approve(id, true))
          .to.be.revertedWithCustomError(plugin, 'ApprovalCastForbidden')
          .withArgs(id, alice.address);
      });

      it('reverts if minimal approval is not met yet', async () => {
        const {
          alice,
          initializedPlugin: plugin,
          dummyMetadata,
          dummyActions,
          dao,
        } = await loadFixture(fixture);

        const endDate = (await time.latest()) + TIME.HOUR;

        // Create a proposal (with ID 0)
        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        const id = 0;

        await dao.grant(
          dao.address,
          plugin.address,
          DAO_PERMISSIONS.EXECUTE_PERMISSION_ID
        );

        const proposal = await plugin.getProposal(id);
        expect(proposal.approvals).to.eq(0);
        await expect(plugin.connect(alice).execute(id))
          .to.be.revertedWithCustomError(plugin, 'ProposalExecutionForbidden')
          .withArgs(id);
      });

      it('approves with the msg.sender address', async () => {
        const {
          alice,
          initializedPlugin: plugin,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const endDate = (await time.latest()) + TIME.HOUR;

        // Create a proposal (with ID 0)
        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        const id = 0;

        expect((await plugin.getProposal(id)).approvals).to.equal(0);

        const tx = await plugin.connect(alice).approve(id, false);

        const event = await findEvent<ApprovedEvent>(tx, 'Approved');
        expect(event.args.proposalId).to.eq(id);
        expect(event.args.approver).to.not.eq(plugin.address);
        expect(event.args.approver).to.eq(alice.address);

        expect((await plugin.getProposal(id)).approvals).to.equal(1);
      });

      it("reverts if the proposal hasn't started yet", async () => {
        const {
          alice,
          initializedPlugin: plugin,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const startDate = (await time.latest()) + TIME.MINUTE;
        const endDate = startDate + TIME.HOUR;

        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            startDate,
            endDate
          );
        const id = 0;

        await expect(
          plugin.connect(alice).approve(id, false)
        ).to.be.revertedWithCustomError(plugin, 'ApprovalCastForbidden');

        await time.increaseTo(startDate);

        await expect(plugin.connect(alice).approve(id, false)).not.to.be
          .reverted;
      });

      it('reverts if the proposal has ended', async () => {
        const {
          alice,
          initializedPlugin: plugin,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const startDate = (await time.latest()) + TIME.MINUTE;
        const endDate = startDate + TIME.HOUR;

        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        const id = 0;

        await expect(plugin.connect(alice).approve(id, false)).not.to.be
          .reverted;

        await time.increaseTo(endDate + 1);

        await expect(
          plugin.connect(alice).approve(id, false)
        ).to.be.revertedWithCustomError(plugin, 'ApprovalCastForbidden');
      });
    });

    describe('canExecute', async () => {
      it('returns `false` if the proposal has not reached the minimum approval yet', async () => {
        const {
          alice,
          initializedPlugin: plugin,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const endDate = (await time.latest()) + TIME.HOUR;

        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        const id = 0;

        const proposal = await plugin.getProposal(id);
        expect(proposal.approvals).to.be.lt(proposal.parameters.minApprovals);

        expect(await plugin.canExecute(id)).to.be.false;
      });

      it('returns `false` if the proposal is already executed', async () => {
        const {
          alice,
          bob,
          initializedPlugin: plugin,
          dao,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const endDate = (await time.latest()) + TIME.HOUR;

        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        const id = 0;

        await dao.grant(
          dao.address,
          plugin.address,
          DAO_PERMISSIONS.EXECUTE_PERMISSION_ID
        );

        await plugin.connect(alice).approve(id, false);
        await plugin.connect(bob).approve(id, true);

        expect((await plugin.getProposal(id)).executed).to.be.true;

        expect(await plugin.canExecute(id)).to.be.false;
      });

      it('returns `true` if the proposal can be executed', async () => {
        const {
          alice,
          bob,
          initializedPlugin: plugin,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const endDate = (await time.latest()) + TIME.HOUR;

        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        const id = 0;

        await plugin.connect(alice).approve(id, false);
        await plugin.connect(bob).approve(id, false);

        expect((await plugin.getProposal(id)).executed).to.be.false;
        expect(await plugin.canExecute(id)).to.be.true;
      });

      it("returns `false` if the proposal hasn't started yet", async () => {
        const {
          alice,
          bob,
          carol,
          initializedPlugin: plugin,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const startDate = (await time.latest()) + TIME.MINUTE;
        const endDate = startDate + TIME.HOUR;

        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            startDate,
            endDate
          );
        const id = 0;

        expect(await plugin.canExecute(id)).to.be.false;

        await time.increaseTo(startDate);
        await plugin.connect(alice).approve(id, false);
        await plugin.connect(bob).approve(id, false);
        await plugin.connect(carol).approve(id, false);

        expect(await plugin.canExecute(id)).to.be.true;
      });

      it('returns `false` if the proposal has ended', async () => {
        const {
          alice,
          bob,
          carol,
          initializedPlugin: plugin,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const endDate = (await time.latest()) + TIME.HOUR;

        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        const id = 0;

        await plugin.connect(alice).approve(id, false);
        await plugin.connect(bob).approve(id, false);
        await plugin.connect(carol).approve(id, false);

        expect(await plugin.canExecute(id)).to.be.true;

        await time.increaseTo(endDate + 1);

        expect(await plugin.canExecute(id)).to.be.false;
      });
    });

    describe('execute', async () => {
      it('reverts if the minimum approval is not met', async () => {
        const {
          alice,
          initializedPlugin: plugin,
          dao,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const endDate = (await time.latest()) + TIME.HOUR;

        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        const id = 0;

        await dao.grant(
          dao.address,
          plugin.address,
          DAO_PERMISSIONS.EXECUTE_PERMISSION_ID
        );

        await expect(plugin.execute(id))
          .to.be.revertedWithCustomError(plugin, 'ProposalExecutionForbidden')
          .withArgs(id);
      });

      it('executes if the minimum approval is met', async () => {
        const {
          alice,
          bob,

          initializedPlugin: plugin,
          defaultInitData,
          dao,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const endDate = (await time.latest()) + TIME.HOUR;

        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        const id = 0;

        await dao.grant(
          dao.address,
          plugin.address,
          DAO_PERMISSIONS.EXECUTE_PERMISSION_ID
        );

        await plugin.connect(alice).approve(id, false);
        await plugin.connect(bob).approve(id, false);

        const proposal = await plugin.getProposal(id);

        expect(proposal.parameters.minApprovals).to.equal(
          defaultInitData.settings.minApprovals
        );
        expect(proposal.approvals).to.be.eq(
          defaultInitData.settings.minApprovals
        );

        expect(await plugin.canExecute(id)).to.be.true;
        await expect(plugin.execute(id)).not.to.be.reverted;
      });

      it('executes if the minimum approval is met and can be called by an unlisted accounts', async () => {
        const {
          alice,
          bob,
          dave,
          initializedPlugin: plugin,
          defaultInitData,
          dao,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const endDate = (await time.latest()) + TIME.HOUR;

        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        const id = 0;

        await dao.grant(
          dao.address,
          plugin.address,
          DAO_PERMISSIONS.EXECUTE_PERMISSION_ID
        );

        await plugin.connect(alice).approve(id, false);
        await plugin.connect(bob).approve(id, false);

        const proposal = await plugin.getProposal(id);

        expect(proposal.parameters.minApprovals).to.equal(
          defaultInitData.settings.minApprovals
        );
        expect(proposal.approvals).to.be.eq(
          defaultInitData.settings.minApprovals
        );

        expect(await plugin.canExecute(id)).to.be.true;
        expect(await plugin.isListed(dave.address)).to.be.false; // Dave is not listed
        await expect(plugin.connect(dave).execute(id)).not.to.be.reverted;
      });

      it('executes if the minimum approval is met when multisig with the `tryExecution` option', async () => {
        const {
          alice,
          bob,
          carol,
          initializedPlugin: plugin,
          dao,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const endDate = (await time.latest()) + TIME.HOUR;

        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        const id = 0;

        await dao.grant(
          dao.address,
          plugin.address,
          DAO_PERMISSIONS.EXECUTE_PERMISSION_ID
        );

        // `tryExecution` is turned on but the vote is not decided yet
        let tx = await plugin.connect(alice).approve(id, true);
        await expect(
          findEventTopicLog<ExecutedEvent>(
            tx,
            DAO__factory.createInterface(),
            IDAO_EVENTS.Executed
          )
        ).to.rejectedWith(
          `Event "${IDAO_EVENTS.Executed}" could not be found in transaction ${tx.hash}.`
        );

        expect(await plugin.canExecute(id)).to.equal(false);

        // `tryExecution` is turned off and the vote is decided
        tx = await plugin.connect(bob).approve(id, false);
        await expect(
          findEventTopicLog<ExecutedEvent>(
            tx,
            DAO__factory.createInterface(),
            IDAO_EVENTS.Executed
          )
        ).to.rejectedWith(
          `Event "${IDAO_EVENTS.Executed}" could not be found in transaction ${tx.hash}.`
        );

        // `tryEarlyExecution` is turned on and the vote is decided
        tx = await plugin.connect(carol).approve(id, true);
        {
          const event = await findEventTopicLog<ExecutedEvent>(
            tx,
            DAO__factory.createInterface(),
            IDAO_EVENTS.Executed
          );

          expect(event.args.actor).to.equal(plugin.address);
          expect(event.args.callId).to.equal(proposalIdToBytes32(id));
          expect(event.args.actions.length).to.equal(1);
          expect(event.args.actions[0].to).to.equal(dummyActions[0].to);
          expect(event.args.actions[0].value).to.equal(dummyActions[0].value);
          expect(event.args.actions[0].data).to.equal(dummyActions[0].data);
          expect(event.args.execResults).to.deep.equal(['0x']);

          const prop = await plugin.getProposal(id);
          expect(prop.executed).to.equal(true);
        }

        // check for the `ProposalExecuted` event in the multisig contract
        {
          const event = await findEvent<ProposalExecutedEvent>(
            tx,
            IPROPOSAL_EVENTS.ProposalExecuted
          );
          expect(event.args.proposalId).to.equal(id);
        }

        // calling execute again should fail
        await expect(plugin.execute(id))
          .to.be.revertedWithCustomError(plugin, 'ProposalExecutionForbidden')
          .withArgs(id);
      });

      it('emits the `ProposalExecuted` and `Executed` events', async () => {
        const {
          alice,
          bob,
          initializedPlugin: plugin,
          dao,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const endDate = (await time.latest()) + TIME.HOUR;

        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        const id = 0;

        await dao.grant(
          dao.address,
          plugin.address,
          DAO_PERMISSIONS.EXECUTE_PERMISSION_ID
        );

        await plugin.connect(alice).approve(id, false);
        await plugin.connect(bob).approve(id, false);

        await expect(plugin.connect(alice).execute(id))
          .to.emit(dao, IDAO_EVENTS.Executed)
          .to.emit(plugin, IPROPOSAL_EVENTS.ProposalExecuted)
          .to.not.emit(plugin, MULTISIG_EVENTS.Approved);
      });

      it('emits the `Approved`, `ProposalExecuted`, and `Executed` events if execute is called inside the `approve` method', async () => {
        const {
          alice,
          bob,
          initializedPlugin: plugin,
          dao,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const endDate = (await time.latest()) + TIME.HOUR;

        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        const id = 0;

        await dao.grant(
          dao.address,
          plugin.address,
          DAO_PERMISSIONS.EXECUTE_PERMISSION_ID
        );

        await plugin.connect(alice).approve(id, false);

        await expect(plugin.connect(bob).approve(id, true))
          .to.emit(dao, IDAO_EVENTS.Executed)
          .to.emit(plugin, IPROPOSAL_EVENTS.ProposalExecuted)
          .to.emit(plugin, MULTISIG_EVENTS.Approved);
      });

      it("reverts if the proposal hasn't started yet", async () => {
        const {
          alice,
          bob,
          initializedPlugin: plugin,
          dao,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const startDate = (await time.latest()) + TIME.MINUTE;
        const endDate = startDate + TIME.HOUR;

        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            startDate,
            endDate
          );

        const id = 0;

        await dao.grant(
          dao.address,
          plugin.address,
          DAO_PERMISSIONS.EXECUTE_PERMISSION_ID
        );

        await expect(plugin.execute(id)).to.be.revertedWithCustomError(
          plugin,
          'ProposalExecutionForbidden'
        );

        await time.increaseTo(startDate);

        await plugin.connect(alice).approve(id, false);
        await plugin.connect(bob).approve(id, false);

        await expect(plugin.execute(id)).not.to.be.reverted;
      });

      it('reverts if the proposal has ended', async () => {
        const {
          alice,
          bob,
          carol,
          initializedPlugin: plugin,
          dummyMetadata,
          dummyActions,
        } = await loadFixture(fixture);

        const startDate = (await time.latest()) + TIME.MINUTE;
        const endDate = startDate + TIME.HOUR;

        await plugin
          .connect(alice)
          .createProposal(
            dummyMetadata,
            dummyActions,
            0,
            false,
            false,
            0,
            endDate
          );
        const id = 0;

        await plugin.connect(alice).approve(id, false);
        await plugin.connect(bob).approve(id, false);
        await plugin.connect(carol).approve(id, false);

        await time.increase(10000);
        await expect(
          plugin.connect(bob).execute(id)
        ).to.be.revertedWithCustomError(plugin, 'ProposalExecutionForbidden');
      });
    });
  });
});

type FixtureResult = {
  deployer: SignerWithAddress;
  alice: SignerWithAddress;
  bob: SignerWithAddress;
  carol: SignerWithAddress;
  dave: SignerWithAddress;
  eve: SignerWithAddress;
  ivan: SignerWithAddress;
  initializedPlugin: Multisig;
  uninitializedPlugin: Multisig;
  defaultInitData: {
    members: string[];
    settings: MultisigSettings;
  };
  dao: DAO;
  dummyActions: DAOStructs.ActionStruct[];
  dummyMetadata: string;
};

async function fixture(): Promise<FixtureResult> {
  const [deployer, alice, bob, carol, dave, eve, ivan] =
    await ethers.getSigners();

  const dummyMetadata = ethers.utils.hexlify(
    ethers.utils.toUtf8Bytes('0x123456789')
  );
  const dao = await createDaoProxy(deployer, dummyMetadata);

  const pluginImplementation = await new Multisig__factory(deployer).deploy();
  const proxyFactory = await new ProxyFactory__factory(deployer).deploy(
    pluginImplementation.address
  );

  // Create an initialized plugin clone
  const defaultInitData = {
    members: [alice.address, bob.address, carol.address],
    settings: {
      onlyListed: true,
      minApprovals: 2,
    },
  };

  const pluginInitdata = pluginImplementation.interface.encodeFunctionData(
    'initialize',
    [dao.address, defaultInitData.members, defaultInitData.settings]
  );
  const deploymentTx1 = await proxyFactory.deployUUPSProxy(pluginInitdata);
  const proxyCreatedEvent1 = await findEvent<ProxyCreatedEvent>(
    deploymentTx1,
    proxyFactory.interface.getEvent('ProxyCreated').name
  );
  const initializedPlugin = Multisig__factory.connect(
    proxyCreatedEvent1.args.proxy,
    deployer
  );

  const deploymentTx2 = await proxyFactory.deployUUPSProxy([]);
  const proxyCreatedEvent2 = await findEvent<ProxyCreatedEvent>(
    deploymentTx2,
    proxyFactory.interface.getEvent('ProxyCreated').name
  );
  const uninitializedPlugin = Multisig__factory.connect(
    proxyCreatedEvent2.args.proxy,
    deployer
  );

  const dummyActions: DAOStructs.ActionStruct[] = [
    {
      to: deployer.address,
      data: '0x1234',
      value: 0,
    },
  ];

  return {
    deployer,
    alice,
    bob,
    carol,
    dave,
    eve,
    ivan,
    initializedPlugin,
    uninitializedPlugin,
    defaultInitData,
    dao,
    dummyActions,
    dummyMetadata,
  };
}
