// import {PLUGIN_CONTRACT_NAME} from '../../plugin-settings';
// import {
//   DAOMock,
//   DAOMock__factory,
//   MyPlugin,
//   MyPlugin__factory,
// } from '../../typechain';
// import '../../typechain/src/MyPlugin';
// import {loadFixture} from '@nomicfoundation/hardhat-network-helpers';
// import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
// import {expect} from 'chai';
// import {BigNumber} from 'ethers';
// import {ethers, upgrades} from 'hardhat';

// export type InitData = {number: BigNumber};
// export const defaultInitData: InitData = {
//   number: BigNumber.from(123),
// };

// export const STORE_PERMISSION_ID = ethers.utils.id('STORE_PERMISSION');

// type FixtureResult = {
//   deployer: SignerWithAddress;
//   alice: SignerWithAddress;
//   bob: SignerWithAddress;
//   plugin: MyPlugin;
//   daoMock: DAOMock;
// };

// async function fixture(): Promise<FixtureResult> {
//   const [deployer, alice, bob] = await ethers.getSigners();
//   const daoMock = await new DAOMock__factory(deployer).deploy();
//   const plugin = (await upgrades.deployProxy(
//     new MyPlugin__factory(deployer),
//     [daoMock.address, defaultInitData.number],
//     {
//       kind: 'uups',
//       initializer: 'initialize',
//       unsafeAllow: ['constructor'],
//       constructorArgs: [],
//     }
//   )) as unknown as MyPlugin;

//   return {deployer, alice, bob, plugin, daoMock};
// }

// describe(PLUGIN_CONTRACT_NAME, function () {
//   describe('initialize', async () => {
//     it('reverts if trying to re-initialize', async () => {
//       const {plugin, daoMock} = await loadFixture(fixture);
//       await expect(
//         plugin.initialize(daoMock.address, defaultInitData.number)
//       ).to.be.revertedWith('Initializable: contract is already initialized');
//     });

//     it('stores the number', async () => {
//       const {plugin} = await loadFixture(fixture);

//       expect(await plugin.number()).to.equal(defaultInitData.number);
//     });
//   });

//   describe('storeNumber', async () => {
//     it('reverts if sender lacks permission', async () => {
//       const newNumber = BigNumber.from(456);

//       const {bob, plugin, daoMock} = await loadFixture(fixture);

//       expect(await daoMock.hasPermissionReturnValueMock()).to.equal(false);

//       await expect(plugin.connect(bob).storeNumber(newNumber))
//         .to.be.revertedWithCustomError(plugin, 'DaoUnauthorized')
//         .withArgs(
//           daoMock.address,
//           plugin.address,
//           bob.address,
//           STORE_PERMISSION_ID
//         );
//     });

//     it('stores the number', async () => {
//       const newNumber = BigNumber.from(456);

//       const {plugin, daoMock} = await loadFixture(fixture);
//       await daoMock.setHasPermissionReturnValueMock(true);

//       await expect(plugin.storeNumber(newNumber)).to.not.be.reverted;
//       expect(await plugin.number()).to.equal(newNumber);
//     });

//     it('emits the NumberStored event', async () => {
//       const newNumber = BigNumber.from(456);

//       const {plugin, daoMock} = await loadFixture(fixture);
//       await daoMock.setHasPermissionReturnValueMock(true);

//       await expect(plugin.storeNumber(newNumber))
//         .to.emit(plugin, 'NumberStored')
//         .withArgs(newNumber);
//     });
//   });
// });
