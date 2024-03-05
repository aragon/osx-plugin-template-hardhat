// import {METADATA} from '../../plugin-settings';
// import {
//   DAOMock,
//   DAOMock__factory,
//   MyPluginSetup,
//   MyPluginSetup__factory,
//   MyPlugin__factory,
// } from '../../typechain';
// import {getProductionNetworkName, findPluginRepo} from '../../utils/helpers';
// import {installPLugin, uninstallPLugin} from './test-helpers';
// import {
//   getLatestNetworkDeployment,
//   getNetworkNameByAlias,
// } from '@aragon/osx-commons-configs';
// import {
//   UnsupportedNetworkError,
//   getNamedTypesFromMetadata,
// } from '@aragon/osx-commons-sdk';
// import {
//   PluginSetupProcessor,
//   PluginRepo,
//   PluginSetupProcessorStructs,
//   PluginSetupProcessor__factory,
// } from '@aragon/osx-ethers';
// import {loadFixture} from '@nomicfoundation/hardhat-network-helpers';
// import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
// import {expect} from 'chai';
// import {BigNumber} from 'ethers';
// import env, {deployments, ethers} from 'hardhat';

// const productionNetworkName = getProductionNetworkName(env);

// describe(`PluginSetup processing on network '${productionNetworkName}'`, function () {
//   it('installs & uninstalls the current build', async () => {
//     const {deployer, psp, daoMock, pluginSetup, pluginSetupRef} =
//       await loadFixture(fixture);

//     // Allow all authorized calls to happen
//     await daoMock.setHasPermissionReturnValueMock(true);

//     // Install the current build.
//     const results = await installPLugin(
//       deployer,
//       psp,
//       daoMock,
//       pluginSetupRef,
//       ethers.utils.defaultAbiCoder.encode(
//         getNamedTypesFromMetadata(
//           METADATA.build.pluginSetup.prepareInstallation.inputs
//         ),
//         [123]
//       )
//     );

//     const plugin = MyPlugin__factory.connect(
//       results.preparedEvent.args.plugin,
//       deployer
//     );

//     // Check implementation.
//     expect(await plugin.implementation()).to.be.eq(
//       await pluginSetup.implementation()
//     );

//     // Check state.
//     expect(await plugin.number()).to.eq(123);

//     // Uninstall the current build.
//     await uninstallPLugin(
//       deployer,
//       psp,
//       daoMock,
//       plugin,
//       pluginSetupRef,
//       ethers.utils.defaultAbiCoder.encode(
//         getNamedTypesFromMetadata(
//           METADATA.build.pluginSetup.prepareUninstallation.inputs
//         ),
//         []
//       ),
//       []
//     );
//   });
// });

// type FixtureResult = {
//   deployer: SignerWithAddress;
//   alice: SignerWithAddress;
//   bob: SignerWithAddress;
//   daoMock: DAOMock;
//   psp: PluginSetupProcessor;
//   pluginRepo: PluginRepo;
//   pluginSetup: MyPluginSetup;
//   pluginSetupRef: PluginSetupProcessorStructs.PluginSetupRefStruct;
// };

// async function fixture(): Promise<FixtureResult> {
//   // Deploy all contracts
//   const tags = ['CreateRepo', 'NewVersion'];
//   await deployments.fixture(tags);

//   const [deployer, alice, bob] = await ethers.getSigners();
//   const daoMock = await new DAOMock__factory(deployer).deploy();

//   const network = getNetworkNameByAlias(productionNetworkName);
//   if (network === null) {
//     throw new UnsupportedNetworkError(productionNetworkName);
//   }
//   const networkDeployments = getLatestNetworkDeployment(network);
//   if (networkDeployments === null) {
//     throw `Deployments are not available on network ${network}.`;
//   }

//   // Get the `PluginSetupProcessor` from the network
//   const psp = PluginSetupProcessor__factory.connect(
//     networkDeployments.PluginSetupProcessor.address,
//     deployer
//   );

//   // Get the deployed `PluginRepo`
//   const {pluginRepo, ensDomain} = await findPluginRepo(env);
//   if (pluginRepo === null) {
//     throw `PluginRepo '${ensDomain}' does not exist yet.`;
//   }

//   const release = 1;
//   const pluginSetup = MyPluginSetup__factory.connect(
//     (await pluginRepo['getLatestVersion(uint8)'](release)).pluginSetup,
//     deployer
//   );

//   const pluginSetupRef = {
//     versionTag: {
//       release: BigNumber.from(1),
//       build: BigNumber.from(1),
//     },
//     pluginSetupRepo: pluginRepo.address,
//   };

//   return {
//     deployer,
//     alice,
//     bob,
//     psp,
//     daoMock,
//     pluginRepo,
//     pluginSetup,
//     pluginSetupRef,
//   };
// }
