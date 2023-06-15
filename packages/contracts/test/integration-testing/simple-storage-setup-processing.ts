import {DAO, PluginRepo, PluginSetupProcessor} from '../../typechain';
import {findEventTopicLog, osxContracts} from '../../utils/helpers';
import {toHex, uploadToIPFS} from '../../utils/ipfs-upload';
import {deployTestDao} from '../helpers/test-dao';
import {createPluginSetupProcessor} from '../helpers/test-psp';
import {
  PluginRepoFactory__factory,
  PluginRepoRegistry__factory,
  PluginRepo__factory,
} from '@aragon/osx-ethers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {ethers} from 'hardhat';

const releaseMetadata: string = '';

describe('SimpleStorage Integration', function () {
  let signers: SignerWithAddress[];
  let dao: DAO;
  let pluginRepo: PluginRepo;
  let psp: PluginSetupProcessor;
  let buildMetadatas: string[];

  before(async () => {
    signers = await ethers.getSigners();

    // Deploy DAO.
    dao = await deployTestDao(signers[0]);

    // Deploy setups.

    const hardhatForkNetwork = process.env.HARDHAT_FORK_NETWORK
      ? process.env.HARDHAT_FORK_NETWORK
      : 'mainnet';

    // Create the plugin repo
    pluginRepo = await populatePluginRepo(
      signers[0],
      osxContracts[hardhatForkNetwork].PluginRepoFactory,
      '123-plugin-repo',
      releaseMetadata,
      [],
      buildMetadatas
    );

    psp = await createPluginSetupProcessor(signers[0], dao);
  });
});

export async function populatePluginRepo(
  signer: SignerWithAddress,
  pluginRepoFactory: string,
  repoEnsName: string,
  releaseMetadata: string,
  setups: string[],
  buildMetadatas: string[]
): Promise<PluginRepo> {
  const pluginRepoFactoryContract = PluginRepoFactory__factory.connect(
    pluginRepoFactory,
    signer
  );

  // Create Repo for Release 1 and Build 1
  const tx = await pluginRepoFactoryContract.createPluginRepo(
    repoEnsName,

    signer.address
  );

  const eventLog = await findEventTopicLog(
    tx,
    PluginRepoRegistry__factory.createInterface(),
    'PluginRepoRegistered'
  );

  const pluginRepo = PluginRepo__factory.connect(
    eventLog.args.pluginRepo,
    signer
  );

  for (let index = 0; index < setups.length; index++) {
    const releaseNumber = 1;

    await pluginRepo.createVersion(
      releaseNumber,
      setups[1],
      toHex(releaseMetadata),
      toHex(buildMetadatas[index])
    );
  }

  return pluginRepo;
}
