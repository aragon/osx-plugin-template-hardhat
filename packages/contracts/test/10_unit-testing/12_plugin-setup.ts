import {createDaoProxy} from '../20_integration-testing/test-helpers';
import metadata from '../../src/build-metadata.json';
import {
  MultisigSetup,
  MultisigSetup__factory,
  ProxyFactory__factory,
} from '../../typechain';
import {ProxyCreatedEvent} from '../../typechain/@aragon/osx-commons-contracts/src/utils/deployment/ProxyFactory';
import {hashHelpers} from '../../utils/helpers';
import {
  MULTISIG_INTERFACE,
  MultisigSettings,
  UPDATE_MULTISIG_SETTINGS_PERMISSION_ID,
} from '../multisig-constants';
import {Multisig__factory, Multisig} from '../test-utils/typechain-versions';
import {
  getInterfaceId,
  findEvent,
  Operation,
  DAO_PERMISSIONS,
  PLUGIN_UUPS_UPGRADEABLE_PERMISSIONS,
  getNamedTypesFromMetadata,
} from '@aragon/osx-commons-sdk';
import {
  DAO,
  IPluginRepo__factory,
  InterfaceBasedRegistryMock,
  InterfaceBasedRegistryMock__factory,
  PluginRepo,
  PluginRepo__factory,
  PluginSetupProcessor,
  PluginSetupProcessorEvents,
  PluginSetupProcessor__factory,
} from '@aragon/osx-ethers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {ethers} from 'hardhat';

const abiCoder = ethers.utils.defaultAbiCoder;
const AddressZero = ethers.constants.AddressZero;
const EMPTY_DATA = '0x';

let defaultMultisigSettings: MultisigSettings;

describe('MultisigSetup', function () {
  let signers: SignerWithAddress[];
  let multisigSetup: MultisigSetup;
  let MultisigFactory: Multisig__factory;
  let implementationAddress: string;
  let targetDao: DAO;
  let minimum_data: any;

  before(async () => {
    signers = await ethers.getSigners();
    targetDao = await createDaoProxy(signers[0], EMPTY_DATA);

    defaultMultisigSettings = {
      onlyListed: true,
      minApprovals: 1,
    };

    minimum_data = abiCoder.encode(
      getNamedTypesFromMetadata(
        metadata.pluginSetup.prepareInstallation.inputs
      ),
      [[signers[0].address], Object.values(defaultMultisigSettings)]
    );

    const MultisigSetup = new MultisigSetup__factory(signers[0]);
    multisigSetup = await MultisigSetup.deploy();

    MultisigFactory = new Multisig__factory(signers[0]);

    implementationAddress = await multisigSetup.implementation();
  });

  it('does not support the empty interface', async () => {
    expect(await multisigSetup.supportsInterface('0xffffffff')).to.be.false;
  });

  it('creates multisig base with the correct interface', async () => {
    const factory = new Multisig__factory(signers[0]);
    const multisigContract = factory.attach(implementationAddress);

    expect(
      await multisigContract.supportsInterface(
        getInterfaceId(MULTISIG_INTERFACE)
      )
    ).to.be.true;
  });

  describe('prepareInstallation', async () => {
    it('fails if data is empty, or not of minimum length', async () => {
      await expect(
        multisigSetup.prepareInstallation(targetDao.address, EMPTY_DATA)
      ).to.be.reverted;

      await expect(
        multisigSetup.prepareInstallation(
          targetDao.address,
          minimum_data.substring(0, minimum_data.length - 2)
        )
      ).to.be.reverted;

      await expect(
        multisigSetup.prepareInstallation(targetDao.address, minimum_data)
      ).not.to.be.reverted;
    });

    it('reverts if zero members are provided in `_data`', async () => {
      const noMembers: string[] = [];

      const wrongPrepareInstallationData = abiCoder.encode(
        getNamedTypesFromMetadata(
          metadata.pluginSetup.prepareInstallation.inputs
        ),
        [noMembers, defaultMultisigSettings]
      );

      const nonce = await ethers.provider.getTransactionCount(
        multisigSetup.address
      );
      const anticipatedPluginAddress = ethers.utils.getContractAddress({
        from: multisigSetup.address,
        nonce,
      });

      const multisig = MultisigFactory.attach(anticipatedPluginAddress);

      await expect(
        multisigSetup.prepareInstallation(
          targetDao.address,
          wrongPrepareInstallationData
        )
      )
        .to.be.revertedWithCustomError(multisig, 'MinApprovalsOutOfBounds')
        .withArgs(0, 1);
    });

    it('reverts if the `minApprovals` value in `_data` is zero', async () => {
      const multisigSettings: MultisigSettings = {
        onlyListed: true,
        minApprovals: 0,
      };
      const members = [signers[0].address];

      const wrongPrepareInstallationData = abiCoder.encode(
        getNamedTypesFromMetadata(
          metadata.pluginSetup.prepareInstallation.inputs
        ),
        [members, multisigSettings]
      );

      const nonce = await ethers.provider.getTransactionCount(
        multisigSetup.address
      );
      const anticipatedPluginAddress = ethers.utils.getContractAddress({
        from: multisigSetup.address,
        nonce,
      });
      const multisig = MultisigFactory.attach(anticipatedPluginAddress);

      await expect(
        multisigSetup.prepareInstallation(
          targetDao.address,
          wrongPrepareInstallationData
        )
      )
        .to.be.revertedWithCustomError(multisig, 'MinApprovalsOutOfBounds')
        .withArgs(1, 0);
    });

    it('reverts if the `minApprovals` value in `_data` is greater than the number members', async () => {
      const multisigSettings: MultisigSettings = {
        onlyListed: true,
        minApprovals: 2,
      };
      const members = [signers[0].address];

      const wrongPrepareInstallationData = abiCoder.encode(
        getNamedTypesFromMetadata(
          metadata.pluginSetup.prepareInstallation.inputs
        ),
        [members, multisigSettings]
      );

      const nonce = await ethers.provider.getTransactionCount(
        multisigSetup.address
      );
      const anticipatedPluginAddress = ethers.utils.getContractAddress({
        from: multisigSetup.address,
        nonce,
      });
      const multisig = MultisigFactory.attach(anticipatedPluginAddress);

      await expect(
        multisigSetup.prepareInstallation(
          targetDao.address,
          wrongPrepareInstallationData
        )
      )
        .to.be.revertedWithCustomError(multisig, 'MinApprovalsOutOfBounds')
        .withArgs(members.length, multisigSettings.minApprovals);
    });

    it('returns the plugin, helpers, and permissions', async () => {
      const nonce = await ethers.provider.getTransactionCount(
        multisigSetup.address
      );
      const anticipatedPluginAddress = ethers.utils.getContractAddress({
        from: multisigSetup.address,
        nonce,
      });

      const {
        plugin,
        preparedSetupData: {helpers, permissions},
      } = await multisigSetup.callStatic.prepareInstallation(
        targetDao.address,
        minimum_data
      );

      expect(plugin).to.be.equal(anticipatedPluginAddress);
      expect(helpers.length).to.be.equal(0);
      expect(permissions.length).to.be.equal(3);
      expect(permissions).to.deep.equal([
        [
          Operation.Grant,
          plugin,
          targetDao.address,
          AddressZero,
          UPDATE_MULTISIG_SETTINGS_PERMISSION_ID,
        ],
        [
          Operation.Grant,
          plugin,
          targetDao.address,
          AddressZero,
          PLUGIN_UUPS_UPGRADEABLE_PERMISSIONS.UPGRADE_PLUGIN_PERMISSION_ID,
        ],
        [
          Operation.Grant,
          targetDao.address,
          plugin,
          AddressZero,
          DAO_PERMISSIONS.EXECUTE_PERMISSION_ID,
        ],
      ]);
    });

    it('sets up the plugin', async () => {
      const daoAddress = targetDao.address;

      const nonce = await ethers.provider.getTransactionCount(
        multisigSetup.address
      );
      const anticipatedPluginAddress = ethers.utils.getContractAddress({
        from: multisigSetup.address,
        nonce,
      });

      await multisigSetup.prepareInstallation(daoAddress, minimum_data);

      const factory = new Multisig__factory(signers[0]);
      const multisigContract = factory.attach(anticipatedPluginAddress);

      expect(await multisigContract.dao()).to.eq(daoAddress);
      expect(await multisigContract.addresslistLength()).to.be.eq(1);
      const settings = await multisigContract.multisigSettings();
      expect(settings.onlyListed).to.be.true;
      expect(settings.minApprovals).to.eq(1);
    });
  });

  describe('prepareUpdate', async () => {
    it('should return nothing', async () => {
      const dao = ethers.Wallet.createRandom().address;
      const currentBuild = 1;
      const prepareUpdateData = await multisigSetup.callStatic.prepareUpdate(
        dao,
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
      const plugin = ethers.Wallet.createRandom().address;

      const permissions = await multisigSetup.callStatic.prepareUninstallation(
        targetDao.address,
        {
          plugin,
          currentHelpers: [],
          data: EMPTY_DATA,
        }
      );

      expect(permissions.length).to.be.equal(3);
      expect(permissions).to.deep.equal([
        [
          Operation.Revoke,
          plugin,
          targetDao.address,
          AddressZero,
          UPDATE_MULTISIG_SETTINGS_PERMISSION_ID,
        ],
        [
          Operation.Revoke,
          plugin,
          targetDao.address,
          AddressZero,
          PLUGIN_UUPS_UPGRADEABLE_PERMISSIONS.UPGRADE_PLUGIN_PERMISSION_ID,
        ],
        [
          Operation.Revoke,
          targetDao.address,
          plugin,
          AddressZero,
          DAO_PERMISSIONS.EXECUTE_PERMISSION_ID,
        ],
      ]);
    });
  });

  describe('Updates', async () => {
    let psp: PluginSetupProcessor;
    let setup1: MultisigSetup;
    let setup2: MultisigSetup;
    let dao: DAO;
    let managingDAO: DAO;
    let owner: SignerWithAddress;
    let pluginRepoRegistry: InterfaceBasedRegistryMock;
    let pluginRepo: PluginRepo;

    before(async () => {
      [owner] = await ethers.getSigners();
      managingDAO = await createDaoProxy(owner, EMPTY_DATA);

      // Create the PluginRepo
      const pluginRepoImplementation = await new PluginRepo__factory(
        signers[0]
      ).deploy();
      const pluginRepoProxyFactory = await new ProxyFactory__factory(
        signers[0]
      ).deploy(pluginRepoImplementation.address);
      const tx = await pluginRepoProxyFactory.deployUUPSProxy([]);
      const event = await findEvent<ProxyCreatedEvent>(
        tx,
        pluginRepoProxyFactory.interface.getEvent('ProxyCreated').name
      );
      pluginRepo = PluginRepo__factory.connect(event.args.proxy, signers[0]);

      await pluginRepo.initialize(owner.address);

      // Create the PluginRepoRegistry
      const pluginRepoRegistryFactory = new InterfaceBasedRegistryMock__factory(
        owner
      );
      pluginRepoRegistry = await pluginRepoRegistryFactory.deploy();
      await pluginRepoRegistry.initialize(
        managingDAO.address,
        getInterfaceId(IPluginRepo__factory.createInterface())
      );

      // Grant the owner full rights on the registry
      await managingDAO.grant(
        pluginRepoRegistry.address,
        owner.address,
        await pluginRepoRegistry.REGISTER_PERMISSION_ID()
      );

      // Register the PluginRepo in the registry
      await pluginRepoRegistry.register(pluginRepo.address);

      // Create the PluginSetupProcessor
      const pspFactory = new PluginSetupProcessor__factory(owner);
      psp = await pspFactory.deploy(pluginRepoRegistry.address);

      // Prepare all MultisigSetup' - We can reuse the same for now
      const multisigSetupFactory = new MultisigSetup__factory(owner);
      setup1 = await multisigSetupFactory.deploy();
      setup2 = await multisigSetupFactory.deploy();

      // Create the versions in the plugin repo
      await expect(pluginRepo.createVersion(1, setup1.address, '0x00', '0x00'))
        .to.emit(pluginRepo, 'VersionCreated')
        .withArgs(1, 1, setup1.address, '0x00');
      await expect(pluginRepo.createVersion(1, setup2.address, '0x00', '0x00'))
        .to.emit(pluginRepo, 'VersionCreated')
        .withArgs(1, 2, setup2.address, '0x00');
    });

    describe('Release 1 Build 1', () => {
      let plugin: Multisig;
      let helpers: string[];

      before(async () => {
        dao = await createDaoProxy(owner, EMPTY_DATA);
        // grant the owner full permission for plugins
        await dao.applySingleTargetPermissions(psp.address, [
          {
            operation: Operation.Grant,
            who: owner.address,
            permissionId: await psp.APPLY_INSTALLATION_PERMISSION_ID(),
          },
          {
            operation: Operation.Grant,
            who: owner.address,
            permissionId: await psp.APPLY_UPDATE_PERMISSION_ID(),
          },
          {
            operation: Operation.Grant,
            who: owner.address,
            permissionId: await psp.APPLY_UNINSTALLATION_PERMISSION_ID(),
          },
        ]);
        // grant the PSP root to apply stuff
        await dao.grant(
          dao.address,
          psp.address,
          await dao.ROOT_PERMISSION_ID()
        );
      });

      it('should install', async () => {
        const tx = await psp.prepareInstallation(dao.address, {
          pluginSetupRef: {
            versionTag: {
              build: 1,
              release: 1,
            },
            pluginSetupRepo: pluginRepo.address,
          },
          data: ethers.utils.defaultAbiCoder.encode(
            ['address[]', '(bool, uint16)'],
            [[owner.address], [true, 1]]
          ),
        });
        const preparedEvent =
          await findEvent<PluginSetupProcessorEvents.InstallationPreparedEvent>(
            tx,
            'InstallationPrepared'
          );

        await expect(
          psp.applyInstallation(dao.address, {
            pluginSetupRef: {
              versionTag: {
                build: 1,
                release: 1,
              },
              pluginSetupRepo: pluginRepo.address,
            },
            helpersHash: hashHelpers(
              preparedEvent.args.preparedSetupData.helpers
            ),
            permissions: preparedEvent.args.preparedSetupData.permissions,
            plugin: preparedEvent.args.plugin,
          })
        ).to.emit(psp, 'InstallationApplied');

        plugin = Multisig__factory.connect(preparedEvent.args.plugin, owner);
        helpers = preparedEvent.args.preparedSetupData.helpers;

        expect(await plugin.implementation()).to.be.eq(
          await setup1.implementation()
        );
      });

      it('should update to Release 1 Build 2', async () => {
        // grant psp permission to update the proxy implementation
        await dao.grant(
          plugin.address,
          psp.address,
          await plugin.UPGRADE_PLUGIN_PERMISSION_ID()
        );

        const tx = await psp.prepareUpdate(dao.address, {
          currentVersionTag: {
            release: 1,
            build: 1,
          },
          newVersionTag: {
            release: 1,
            build: 2,
          },
          pluginSetupRepo: pluginRepo.address,
          setupPayload: {
            plugin: plugin.address,
            currentHelpers: helpers,
            data: '0x00',
          },
        });
        const preparedEvent =
          await findEvent<PluginSetupProcessorEvents.UpdatePreparedEvent>(
            tx,
            'UpdatePrepared'
          );

        await expect(
          psp.applyUpdate(dao.address, {
            plugin: plugin.address,
            helpersHash: hashHelpers(
              preparedEvent.args.preparedSetupData.helpers
            ),
            permissions: preparedEvent.args.preparedSetupData.permissions,
            initData: preparedEvent.args.initData,
            pluginSetupRef: {
              versionTag: {
                release: 1,
                build: 2,
              },
              pluginSetupRepo: pluginRepo.address,
            },
          })
        ).to.emit(psp, 'UpdateApplied');

        expect(await plugin.implementation()).to.be.eq(
          await setup2.implementation()
        );
      });
    });

    describe('Release 1 Build 2', () => {
      before(async () => {
        dao = await createDaoProxy(owner, EMPTY_DATA);
        // grant the owner full permission for plugins
        await dao.applySingleTargetPermissions(psp.address, [
          {
            operation: Operation.Grant,
            who: owner.address,
            permissionId: await psp.APPLY_INSTALLATION_PERMISSION_ID(),
          },
          {
            operation: Operation.Grant,
            who: owner.address,
            permissionId: await psp.APPLY_UPDATE_PERMISSION_ID(),
          },
          {
            operation: Operation.Grant,
            who: owner.address,
            permissionId: await psp.APPLY_UNINSTALLATION_PERMISSION_ID(),
          },
        ]);
        // grant the PSP root to apply stuff
        await dao.grant(
          dao.address,
          psp.address,
          await dao.ROOT_PERMISSION_ID()
        );
      });

      it('should install', async () => {
        const tx = await psp.prepareInstallation(dao.address, {
          pluginSetupRef: {
            versionTag: {
              release: 1,
              build: 2,
            },
            pluginSetupRepo: pluginRepo.address,
          },
          data: ethers.utils.defaultAbiCoder.encode(
            ['address[]', '(bool, uint16)'],
            [[owner.address], [true, 1]]
          ),
        });
        const preparedEvent =
          await findEvent<PluginSetupProcessorEvents.InstallationPreparedEvent>(
            tx,
            'InstallationPrepared'
          );

        await expect(
          psp.applyInstallation(dao.address, {
            pluginSetupRef: {
              versionTag: {
                release: 1,
                build: 2,
              },
              pluginSetupRepo: pluginRepo.address,
            },
            helpersHash: hashHelpers(
              preparedEvent.args.preparedSetupData.helpers
            ),
            permissions: preparedEvent.args.preparedSetupData.permissions,
            plugin: preparedEvent.args.plugin,
          })
        ).to.emit(psp, 'InstallationApplied');

        const plugin = Multisig__factory.connect(
          preparedEvent.args.plugin,
          owner
        );
        expect(await plugin.implementation()).to.be.eq(
          await setup2.implementation()
        );
      });
    });
  });
});