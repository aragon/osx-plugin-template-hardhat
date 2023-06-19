import {PLUGIN_REPO_NAME} from '../../deploy/01_repo/10_create_repo';
import {
  PluginRepo,
  SimpleStorageSetup,
  SimpleStorageSetup__factory,
} from '../../typechain';
import {getPluginInfo, osxContracts} from '../../utils/helpers';
import {toHex} from '../../utils/ipfs-upload';
import {PluginRepoRegistry__factory} from '@aragon/osx-ethers';
import {PluginRepoRegistry} from '@aragon/osx-ethers';
import {PluginRepo__factory} from '@aragon/osx-ethers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {deployments, ethers} from 'hardhat';

let signers: SignerWithAddress[];
let repoRegistry: PluginRepoRegistry;
let pluginRepo: PluginRepo;

async function deployAll() {
  await deployments.fixture();
}

describe('PluginRepo Deployment', function () {
  before(async () => {
    const hardhatForkNetwork = process.env.HARDHAT_FORK_NETWORK
      ? process.env.HARDHAT_FORK_NETWORK
      : 'mainnet';

    signers = await ethers.getSigners();

    // deployment should be empty
    expect(await deployments.all()).to.be.empty;

    // deploy framework
    await deployAll();

    // plugin repo registry
    repoRegistry = PluginRepoRegistry__factory.connect(
      osxContracts[hardhatForkNetwork]['PluginRepoRegistry'],
      signers[0]
    );

    pluginRepo = PluginRepo__factory.connect(
      getPluginInfo()['hardhat'].address,
      signers[0]
    );
  });
  it('creates the repo', async () => {
    expect(await repoRegistry.entries(pluginRepo.address)).to.be.true;
  });

  it('makes the deployer the repo maintainer', async () => {
    expect(
      await pluginRepo.isGranted(
        pluginRepo.address,
        signers[0].address,
        ethers.utils.id('ROOT_PERMISSION'),
        ethers.constants.AddressZero
      )
    ).to.be.true;

    expect(
      await pluginRepo.isGranted(
        pluginRepo.address,
        signers[0].address,
        ethers.utils.id('UPGRADE_REPO_PERMISSION'),
        ethers.constants.AddressZero
      )
    ).to.be.true;

    expect(
      await pluginRepo.isGranted(
        pluginRepo.address,
        signers[0].address,
        ethers.utils.id('MAINTAINER_PERMISSION'),
        ethers.constants.AddressZero
      )
    ).to.be.true;
  });

  context('PluginSetup Publication', async () => {
    let setup: SimpleStorageSetup;

    before(async () => {
      setup = SimpleStorageSetup__factory.connect(
        (await deployments.get('SimpleStorageSetup')).address,
        signers[0]
      );
    });
    it('registerd the setup', async () => {
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
