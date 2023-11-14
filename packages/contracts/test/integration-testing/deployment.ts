import {
  PluginRepo,
  MyPluginSetup,
  MyPluginSetup__factory,
} from '../../typechain';
import {getPluginInfo, osxContracts} from '../../utils/helpers';
import {toHex} from '../../utils/ipfs';
import {PluginRepoRegistry__factory} from '@aragon/osx-ethers';
import {PluginRepoRegistry} from '@aragon/osx-ethers';
import {PluginRepo__factory} from '@aragon/osx-ethers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {deployments, ethers} from 'hardhat';

async function deployAll() {
  await deployments.fixture();
}

describe('PluginRepo Deployment', function () {
  let alice: SignerWithAddress;
  let repoRegistry: PluginRepoRegistry;
  let pluginRepo: PluginRepo;

  before(async () => {
    const hardhatForkNetwork = process.env.NETWORK_NAME
      ? process.env.NETWORK_NAME
      : 'mainnet';

    [alice] = await ethers.getSigners();

    // Deploymen should be empty
    expect(await deployments.all()).to.be.empty;

    // Deploy all contracts
    await deployAll();

    // Print info
    console.log(JSON.stringify(getPluginInfo('hardhat')['hardhat'], null, 2));

    // plugin repo registry
    repoRegistry = PluginRepoRegistry__factory.connect(
      osxContracts[hardhatForkNetwork]['PluginRepoRegistry'],
      alice
    );

    pluginRepo = PluginRepo__factory.connect(
      getPluginInfo('hardhat')['hardhat'].address,
      alice
    );
  });

  it('creates the repo', async () => {
    expect(await repoRegistry.entries(pluginRepo.address)).to.be.true;
  });

  it('makes the deployer the repo maintainer', async () => {
    expect(
      await pluginRepo.isGranted(
        pluginRepo.address,
        alice.address,
        ethers.utils.id('ROOT_PERMISSION'),
        ethers.constants.AddressZero
      )
    ).to.be.true;

    expect(
      await pluginRepo.isGranted(
        pluginRepo.address,
        alice.address,
        ethers.utils.id('UPGRADE_REPO_PERMISSION'),
        ethers.constants.AddressZero
      )
    ).to.be.true;

    expect(
      await pluginRepo.isGranted(
        pluginRepo.address,
        alice.address,
        ethers.utils.id('MAINTAINER_PERMISSION'),
        ethers.constants.AddressZero
      )
    ).to.be.true;
  });

  context('PluginSetup Publication', async () => {
    let setup: MyPluginSetup;

    before(async () => {
      setup = MyPluginSetup__factory.connect(
        (await deployments.get('MyPluginSetup')).address,
        alice
      );
    });
    it('registers the setup', async () => {
      const results = await pluginRepo['getVersion((uint8,uint16))']({
        release: 1,
        build: 1,
      });

      expect(results.pluginSetup).to.equal(setup.address);
      expect(results.buildMetadata).to.equal(
        toHex('ipfs://QmY919VZ9gkeF6L169qQo89ucsUB9ScTaJVbGn8vMGGHxr')
      );
    });
  });
});
