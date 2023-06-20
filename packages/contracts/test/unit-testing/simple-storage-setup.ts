import {PLUGIN_SETUP_CONTRACT_NAME} from '../../plugin-settings';
import buildMetadata from '../../src/build-metadata.json';
import {
  DAO,
  SimpleStorageSetup,
  SimpleStorageSetup__factory,
  SimpleStorage__factory,
} from '../../typechain';
import {deployTestDao} from '../helpers/test-dao';
import {Operation, getNamedTypesFromMetadata} from '../helpers/types';
import {defaultInitData} from './simple-storage';
import {
  ADDRESS_ZERO,
  EMPTY_DATA,
  NO_CONDITION,
  STORE_PERMISSION_ID,
  abiCoder,
} from './simple-storage-common';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {ethers} from 'hardhat';

describe(PLUGIN_SETUP_CONTRACT_NAME, function () {
  let signers: SignerWithAddress[];
  let simpleStorageSetup: SimpleStorageSetup;
  let SimpleStorageSetup: SimpleStorageSetup__factory;
  let dao: DAO;

  before(async () => {
    signers = await ethers.getSigners();
    dao = await deployTestDao(signers[0]);

    SimpleStorageSetup = new SimpleStorageSetup__factory(signers[0]);
    simpleStorageSetup = await SimpleStorageSetup.deploy();
  });

  describe('prepareInstallation', async () => {
    let initData: string;

    before(async () => {
      initData = abiCoder.encode(
        getNamedTypesFromMetadata(
          buildMetadata.pluginSetup.prepareInstallation.inputs
        ),
        [defaultInitData.number]
      );
    });

    it('returns the plugin, helpers, and permissions', async () => {
      const nonce = await ethers.provider.getTransactionCount(
        simpleStorageSetup.address
      );
      const anticipatedPluginAddress = ethers.utils.getContractAddress({
        from: simpleStorageSetup.address,
        nonce,
      });

      const {
        plugin,
        preparedSetupData: {helpers, permissions},
      } = await simpleStorageSetup.callStatic.prepareInstallation(
        dao.address,
        initData
      );

      expect(plugin).to.be.equal(anticipatedPluginAddress);
      expect(helpers.length).to.be.equal(0);
      expect(permissions.length).to.be.equal(1);
      expect(permissions).to.deep.equal([
        [
          Operation.Grant,
          plugin,
          dao.address,
          NO_CONDITION,
          STORE_PERMISSION_ID,
        ],
      ]);

      await simpleStorageSetup.prepareInstallation(dao.address, initData);
      const simpleStorage = new SimpleStorage__factory(signers[0]).attach(
        plugin
      );

      // initialization is correct
      expect(await simpleStorage.dao()).to.eq(dao.address);
      expect(await simpleStorage.number()).to.be.eq(defaultInitData.number);
    });
  });

  describe('prepareUninstallation', async () => {
    it('returns the permissions', async () => {
      const dummyAddr = ADDRESS_ZERO;

      const permissions =
        await simpleStorageSetup.callStatic.prepareUninstallation(dao.address, {
          plugin: dummyAddr,
          currentHelpers: [],
          data: EMPTY_DATA,
        });

      expect(permissions.length).to.be.equal(1);
      expect(permissions).to.deep.equal([
        [
          Operation.Revoke,
          dummyAddr,
          dao.address,
          NO_CONDITION,
          STORE_PERMISSION_ID,
        ],
      ]);
    });
  });
});
