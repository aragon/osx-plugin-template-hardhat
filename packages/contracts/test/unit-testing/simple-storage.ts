import {PLUGIN_CONTRACT_NAME} from '../../plugin-settings';
import {DAO, SimpleStorage, SimpleStorage__factory} from '../../typechain';
import {deployWithProxy} from '../../utils/helpers';
import {deployTestDao} from '../helpers/test-dao';
import {STORE_PERMISSION_ID} from './simple-storage-common';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {BigNumber} from 'ethers';
import {ethers} from 'hardhat';

export type InitData = {number: BigNumber};
export const defaultInitData: InitData = {
  number: BigNumber.from(123),
};

describe(PLUGIN_CONTRACT_NAME, function () {
  let signers: SignerWithAddress[];
  let dao: DAO;
  let SimpleStorage: SimpleStorage__factory;
  let simpleStorage: SimpleStorage;
  let defaultInput: InitData;

  before(async () => {
    signers = await ethers.getSigners();
    dao = await deployTestDao(signers[0]);

    defaultInput = {number: BigNumber.from(123)};

    SimpleStorage = new SimpleStorage__factory(signers[0]);
  });

  beforeEach(async () => {
    simpleStorage = await deployWithProxy<SimpleStorage>(SimpleStorage);
  });

  describe('initialize', async () => {
    it('reverts if trying to re-initialize', async () => {
      await simpleStorage.initialize(dao.address, defaultInput.number);

      await expect(
        simpleStorage.initialize(dao.address, defaultInput.number)
      ).to.be.revertedWith('Initializable: contract is already initialized');
    });

    it('stores the number', async () => {
      await simpleStorage.initialize(dao.address, defaultInput.number);

      expect(await simpleStorage.number()).to.equal(defaultInput.number);
    });
  });

  describe('storing', async () => {
    describe('storeNumber', async () => {
      const newNumber = BigNumber.from(456);

      beforeEach(async () => {
        await simpleStorage.initialize(dao.address, defaultInput.number);
      });

      it('reverts if sender lacks permission', async () => {
        await expect(simpleStorage.storeNumber(newNumber))
          .to.be.revertedWithCustomError(SimpleStorage, 'DaoUnauthorized')
          .withArgs(
            dao.address,
            simpleStorage.address,
            signers[0].address,
            STORE_PERMISSION_ID
          );
      });

      it('stores the number', async () => {
        await dao.grant(
          simpleStorage.address,
          signers[0].address,
          STORE_PERMISSION_ID
        );

        await expect(simpleStorage.storeNumber(newNumber)).to.not.be.reverted;
        expect(await simpleStorage.number()).to.equal(newNumber);
      });
    });
  });
});
