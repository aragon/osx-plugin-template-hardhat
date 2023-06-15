import {
  PluginRepo,
  SimpleStorageR1B1Setup,
  SimpleStorageR1B1Setup__factory,
  SimpleStorageR1B2Setup,
  SimpleStorageR1B2Setup__factory,
  SimpleStorageR1B3Setup,
  SimpleStorageR1B3Setup__factory,
} from '../../typechain';
import {getDeployedContracts, osxContracts} from '../../utils/helpers';
import {toHex} from '../../utils/ipfs-upload';
import {PluginRepoRegistry__factory} from '@aragon/osx-ethers';
import {PluginRepoRegistry} from '@aragon/osx-ethers';
import {PluginRepo__factory} from '@aragon/osx-ethers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {deployments, ethers} from 'hardhat';

let signers: SignerWithAddress[];
let repoRegistry: PluginRepoRegistry;
let simpleStoragePluginRepo: PluginRepo;

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

    // This assumes that the deployAll wrote the `PluginRepo` entry to the file.
    simpleStoragePluginRepo = PluginRepo__factory.connect(
      getDeployedContracts()['hardhat']['PluginRepo_test-repo-123'],
      signers[0]
    );
  });
  it('creates the repo', async () => {
    expect(await repoRegistry.entries(simpleStoragePluginRepo.address)).to.be
      .true;
  });

  it('makes the deployer the repo maintainer', async () => {
    expect(
      await simpleStoragePluginRepo.isGranted(
        simpleStoragePluginRepo.address,
        signers[0].address,
        ethers.utils.id('ROOT_PERMISSION'),
        ethers.constants.AddressZero
      )
    ).to.be.true;

    expect(
      await simpleStoragePluginRepo.isGranted(
        simpleStoragePluginRepo.address,
        signers[0].address,
        ethers.utils.id('UPGRADE_REPO_PERMISSION'),
        ethers.constants.AddressZero
      )
    ).to.be.true;

    expect(
      await simpleStoragePluginRepo.isGranted(
        simpleStoragePluginRepo.address,
        signers[0].address,
        ethers.utils.id('MAINTAINER_PERMISSION'),
        ethers.constants.AddressZero
      )
    ).to.be.true;
  });
});
