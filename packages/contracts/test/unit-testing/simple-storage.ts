import {PLUGIN_CONTRACT_NAME} from '../../plugin-settings';
import {DAO, MyPlugin, MyPlugin__factory} from '../../typechain';
import '../../typechain/src/MyPlugin';
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
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;
  let dao: DAO;
  let myPlugin: MyPlugin;
  let defaultInput: InitData;

  before(async () => {
    [alice, bob] = await ethers.getSigners();
    dao = await deployTestDao(alice);

    defaultInput = {number: BigNumber.from(123)};
  });

  beforeEach(async () => {
    myPlugin = await deployWithProxy<MyPlugin>(new MyPlugin__factory(alice));

    await myPlugin.initialize(dao.address, defaultInput.number);
  });

  describe('initialize', async () => {
    it('reverts if trying to re-initialize', async () => {
      await expect(
        myPlugin.initialize(dao.address, defaultInput.number)
      ).to.be.revertedWith('Initializable: contract is already initialized');
    });

    it('stores the number', async () => {
      expect(await myPlugin.number()).to.equal(defaultInput.number);
    });
  });

  describe('storeNumber', async () => {
    const newNumber = BigNumber.from(456);

    beforeEach(async () => {
      await dao.grant(myPlugin.address, alice.address, STORE_PERMISSION_ID);
    });

    it('reverts if sender lacks permission', async () => {
      await expect(myPlugin.connect(bob).storeNumber(newNumber))
        .to.be.revertedWithCustomError(myPlugin, 'DaoUnauthorized')
        .withArgs(
          dao.address,
          myPlugin.address,
          bob.address,
          STORE_PERMISSION_ID
        );
    });

    it('stores the number', async () => {
      await expect(myPlugin.storeNumber(newNumber)).to.not.be.reverted;
      expect(await myPlugin.number()).to.equal(newNumber);
    });

    it('emits the NumberStored event', async () => {
      await expect(myPlugin.storeNumber(newNumber))
        .to.emit(myPlugin, 'NumberStored')
        .withArgs(newNumber);
    });
  });
});
