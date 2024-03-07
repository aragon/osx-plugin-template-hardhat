import {createDaoProxy} from '../20_integration-testing/test-helpers';
import {
  Multisig_V1_1__factory,
  Multisig_V1_2__factory,
  Multisig__factory,
  Multisig,
} from '../test-utils/typechain-versions';
import {
  deployAndUpgradeFromToCheck,
  deployAndUpgradeSelfCheck,
  getProtocolVersion,
} from '../test-utils/uups-upgradeable';
import {PLUGIN_UUPS_UPGRADEABLE_PERMISSIONS} from '@aragon/osx-commons-sdk';
import {DAO} from '@aragon/osx-ethers';
import {loadFixture} from '@nomicfoundation/hardhat-network-helpers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {expect} from 'chai';
import {ethers} from 'hardhat';

describe('Upgrades', () => {
  it('upgrades to a new implementation', async () => {
    const {deployer, alice, dao, defaultInitData} = await loadFixture(fixture);
    const currentContractFactory = new Multisig__factory(deployer);

    await deployAndUpgradeSelfCheck(
      deployer,
      alice,
      [dao.address, defaultInitData.members, defaultInitData.settings],
      'initialize',
      currentContractFactory,
      PLUGIN_UUPS_UPGRADEABLE_PERMISSIONS.UPGRADE_PLUGIN_PERMISSION_ID,
      dao
    );
  });

  it('upgrades from v1.1', async () => {
    const {deployer, alice, dao, defaultInitData} = await loadFixture(fixture);
    const currentContractFactory = new Multisig__factory(deployer);
    const legacyContractFactory = new Multisig_V1_1__factory(deployer);

    const {fromImplementation, toImplementation} =
      await deployAndUpgradeFromToCheck(
        deployer,
        alice,
        [dao.address, defaultInitData.members, defaultInitData.settings],
        'initialize',
        legacyContractFactory,
        currentContractFactory,
        PLUGIN_UUPS_UPGRADEABLE_PERMISSIONS.UPGRADE_PLUGIN_PERMISSION_ID,
        dao
      );
    expect(toImplementation).to.not.equal(fromImplementation); // The build did change

    const fromProtocolVersion = await getProtocolVersion(
      legacyContractFactory.attach(fromImplementation)
    );
    const toProtocolVersion = await getProtocolVersion(
      currentContractFactory.attach(toImplementation)
    );

    expect(fromProtocolVersion).to.not.deep.equal(toProtocolVersion);
    expect(fromProtocolVersion).to.deep.equal([1, 0, 0]);
    expect(toProtocolVersion).to.deep.equal([1, 4, 0]);
  });

  it('from v1.2', async () => {
    const {deployer, alice, dao, defaultInitData} = await loadFixture(fixture);
    const currentContractFactory = new Multisig__factory(deployer);
    const legacyContractFactory = new Multisig_V1_2__factory(deployer);

    const {fromImplementation, toImplementation} =
      await deployAndUpgradeFromToCheck(
        deployer,
        alice,
        [dao.address, defaultInitData.members, defaultInitData.settings],
        'initialize',
        legacyContractFactory,
        currentContractFactory,
        PLUGIN_UUPS_UPGRADEABLE_PERMISSIONS.UPGRADE_PLUGIN_PERMISSION_ID,
        dao
      );
    expect(toImplementation).to.not.equal(fromImplementation);

    const fromProtocolVersion = await getProtocolVersion(
      legacyContractFactory.attach(fromImplementation)
    );
    const toProtocolVersion = await getProtocolVersion(
      currentContractFactory.attach(toImplementation)
    );

    expect(fromProtocolVersion).to.not.deep.equal(toProtocolVersion);
    expect(fromProtocolVersion).to.deep.equal([1, 0, 0]);
    expect(toProtocolVersion).to.deep.equal([1, 4, 0]);
  });
});

type FixtureResult = {
  deployer: SignerWithAddress;
  alice: SignerWithAddress;
  bob: SignerWithAddress;
  carol: SignerWithAddress;
  defaultInitData: {
    members: string[];
    settings: Multisig.MultisigSettingsStruct;
  };
  dao: DAO;
};

async function fixture(): Promise<FixtureResult> {
  const [deployer, alice, bob, carol] = await ethers.getSigners();

  const dummyMetadata = ethers.utils.hexlify(
    ethers.utils.toUtf8Bytes('0x123456789')
  );

  const dao = await createDaoProxy(deployer, dummyMetadata);

  // Create an initialized plugin clone
  const defaultInitData = {
    members: [alice.address, bob.address, carol.address],
    settings: {
      onlyListed: true,
      minApprovals: 2,
    },
  };

  return {
    deployer,
    alice,
    bob,
    carol,
    dao,
    defaultInitData,
  };
}
