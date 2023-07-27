import { ERC1967ABI, ERC1967Bytecode } from '../abi';
import * as aragonContracts from '@aragon/osx-ethers';
import {
  MyPluginSetup,
  MyPluginSetup__factory,
} from '@aragon/simple-storage-ethers';
import ENSRegistry from '@ensdomains/ens-contracts/artifacts/contracts/registry/ENSRegistry.sol/ENSRegistry.json';
import PublicResolver from '@ensdomains/ens-contracts/artifacts/contracts/resolvers/PublicResolver.sol/PublicResolver.json';
import { Signer } from '@ethersproject/abstract-signer';
import { hexlify } from '@ethersproject/bytes';
import { AddressZero, HashZero } from '@ethersproject/constants';
import { Contract, ContractFactory } from '@ethersproject/contracts';
import { id, namehash } from '@ethersproject/hash';
import { JsonRpcProvider } from '@ethersproject/providers';
import { toUtf8Bytes } from '@ethersproject/strings';
import { parseEther } from '@ethersproject/units';

export type Deployment = OsxDeployment & MyPluginDeployment & EnsDeployment;

export type MyPluginDeployment = {
  myPluginRepo: aragonContracts.PluginRepo;
  myPluginSetup: MyPluginSetup;
};

export type OsxDeployment = {
  managingDaoAddress: string;
  daoFactory: aragonContracts.DAOFactory;
  daoRegistry: aragonContracts.DAORegistry;
  pluginSetupProcessor: aragonContracts.PluginSetupProcessor;
  pluginRepoFactory: aragonContracts.PluginRepoFactory;
};

export type EnsDeployment = {
  ensRegistry: Contract;
  ensResolver: Contract;
};

const WALLET_ADDRESS = '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199';

export async function deploy(): Promise<Deployment> {
  const provider = new JsonRpcProvider('http://127.0.0.1:8545');
  const deployOwnerWallet = provider.getSigner();
  const ens = await deployEnsContracts(deployOwnerWallet);
  const osx = await deployOsxContracts(deployOwnerWallet, ens);
  const simpleSotrage = await deployMyPluginContracts(deployOwnerWallet, osx);

  // send ETH to hardcoded wallet in tests
  await deployOwnerWallet.sendTransaction({
    to: WALLET_ADDRESS,
    value: parseEther('50.0'),
  });
  return {
    ...osx,
    ...simpleSotrage,
    ...ens,
  };
}

export async function deployMyPluginContracts(
  deployer: Signer,
  osx: OsxDeployment
): Promise<MyPluginDeployment> {
  const myPluginFactory = new MyPluginSetup__factory();
  const myPluginPluginSetup = await myPluginFactory.connect(deployer).deploy();

  const myPluginRepoAddress = await deployPlugin(
    'simple-storage',
    myPluginPluginSetup.address,
    await deployer.getAddress(),
    osx.pluginRepoFactory
  );

  const myPluginRepo = aragonContracts.PluginRepo__factory.connect(
    myPluginRepoAddress,
    deployer
  );

  return {
    myPluginRepo,
    myPluginSetup: myPluginPluginSetup,
  };
}

async function deployPlugin(
  name: string,
  setupAddress: string,
  maintainer: string,
  pluginRepoFactory: aragonContracts.PluginRepoFactory,
  releaseMetadata: string = 'ipfs://QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsMnR',
  buildMetadata: string = 'ipfs://QmbWqxBEKC3P8tqsKc98xmWNzrzDtRLMiMPL8wBuTGsMnR'
) {
  const address =
    await pluginRepoFactory.callStatic.createPluginRepoWithFirstVersion(
      name,
      setupAddress,
      maintainer,
      hexlify(toUtf8Bytes(releaseMetadata)),
      hexlify(toUtf8Bytes(buildMetadata))
    );
  const tx = await pluginRepoFactory.createPluginRepoWithFirstVersion(
    name,
    setupAddress,
    maintainer,
    hexlify(toUtf8Bytes(releaseMetadata)),
    hexlify(toUtf8Bytes(buildMetadata))
  );
  await tx.wait();
  return address;
}

export async function deployOsxContracts(
  signer: Signer,
  ens: EnsDeployment
): Promise<OsxDeployment> {
  try {
    const { ensRegistry, ensResolver } = ens;
    const proxyFactory = new ContractFactory(
      ERC1967ABI,
      ERC1967Bytecode,
      signer
    );
    const managingDaoFactory = new aragonContracts.DAO__factory();

    const managingDao = await managingDaoFactory.connect(signer).deploy();

    const initializeManagingDaoData =
      managingDaoFactory.interface.encodeFunctionData('initialize', [
        '0x',
        await signer.getAddress(),
        AddressZero,
        '0x',
      ]);

    const managingDaoProxy = await proxyFactory.deploy(
      managingDao.address,
      initializeManagingDaoData
    );

    const managingDaoInstance = aragonContracts.DAO__factory.connect(
      managingDaoProxy.address,
      signer
    );

    const ensSubdomainRegistrarFactory =
      new aragonContracts.ENSSubdomainRegistrar__factory();

    // DAO Registrar
    const daoRegistrar = await ensSubdomainRegistrarFactory
      .connect(signer)
      .deploy();
    const pluginRegistrar = await ensSubdomainRegistrarFactory
      .connect(signer)
      .deploy();

    const daoRegsitrarProxy = await proxyFactory.deploy(
      daoRegistrar.address,
      '0x'
    );
    const pluginRegistrarProxy = await proxyFactory.deploy(
      pluginRegistrar.address,
      '0x'
    );
    const daoRegistrarInstance =
      aragonContracts.ENSSubdomainRegistrar__factory.connect(
        daoRegsitrarProxy.address,
        signer
      );
    const pluginRegistrarInstance =
      aragonContracts.ENSSubdomainRegistrar__factory.connect(
        pluginRegistrarProxy.address,
        signer
      );

    await registerEnsName(
      'eth',
      'dao',
      ensRegistry,
      daoRegistrarInstance.address,
      ensResolver.address
    );

    await registerEnsName(
      'eth',
      'plugin',
      ensRegistry,
      pluginRegistrarInstance.address,
      ensResolver.address
    );

    await daoRegistrarInstance.initialize(
      managingDaoInstance.address,
      ensRegistry.address,
      namehash('dao.eth')
    );

    await pluginRegistrarInstance.initialize(
      managingDaoInstance.address,
      ensRegistry.address,
      namehash('plugin.eth')
    );
    // Dao Registry
    const daoRegistryFactory = new aragonContracts.DAORegistry__factory();
    const daoRegistry = await daoRegistryFactory.connect(signer).deploy();
    const daoRegistryProxy = await proxyFactory.deploy(
      daoRegistry.address,
      '0x'
    );
    const daoRegistryInstance = aragonContracts.DAORegistry__factory.connect(
      daoRegistryProxy.address,
      signer
    );

    await daoRegistryInstance.initialize(
      managingDaoInstance.address,
      daoRegistrarInstance.address
    );

    // Plugin Repo Registry
    const pluginRepoRegistryFactory =
      new aragonContracts.PluginRepoRegistry__factory();
    const pluginRepoRegistry = await pluginRepoRegistryFactory
      .connect(signer)
      .deploy();
    const pluginRepoRegistryProxy = await proxyFactory.deploy(
      pluginRepoRegistry.address,
      '0x'
    );
    const pluginRepoRegistryInstance =
      aragonContracts.PluginRepoRegistry__factory.connect(
        pluginRepoRegistryProxy.address,
        signer
      );

    await pluginRepoRegistryInstance.initialize(
      managingDaoInstance.address,
      pluginRegistrarInstance.address
    );

    // Plugin Repo Factory
    const pluginRepoFactoryFactory =
      new aragonContracts.PluginRepoFactory__factory();
    const pluginRepoFactory = await pluginRepoFactoryFactory
      .connect(signer)
      .deploy(pluginRepoRegistryInstance.address);

    // Plugin Setup Prcessor
    const pluginSetupProcessorFacotry =
      new aragonContracts.PluginSetupProcessor__factory();
    const pluginSetupProcessor = await pluginSetupProcessorFacotry
      .connect(signer)
      .deploy(pluginRepoRegistryInstance.address);

    // DAO Factory
    const daoFactoryfactory = new aragonContracts.DAOFactory__factory();
    const daoFactory = await daoFactoryfactory
      .connect(signer)
      .deploy(daoRegistryInstance.address, pluginSetupProcessor.address);

    // Permissions
    // ENS DAO
    await managingDaoInstance.grant(
      daoRegistrarInstance.address,
      daoRegistryInstance.address,
      id('REGISTER_ENS_SUBDOMAIN_PERMISSION')
    );
    // ENS Plugin
    await managingDaoInstance.grant(
      pluginRegistrarInstance.address,
      pluginRepoRegistryInstance.address,
      id('REGISTER_ENS_SUBDOMAIN_PERMISSION')
    );
    // DAO Registry
    await managingDaoInstance.grant(
      daoRegistryInstance.address,
      daoFactory.address,
      id('REGISTER_DAO_PERMISSION')
    );
    // Plugin Registry
    await managingDaoInstance.grant(
      pluginRepoRegistryInstance.address,
      pluginRepoFactory.address,
      id('REGISTER_PLUGIN_REPO_PERMISSION')
    );
    return {
      managingDaoAddress: managingDaoInstance.address,
      daoFactory,
      daoRegistry: daoRegistryInstance,
      pluginSetupProcessor,
      pluginRepoFactory,
    };
  } catch (e) {
    throw e;
  }
}

async function deployEnsContracts(signer: Signer) {
  try {
    const registryFactory = new ContractFactory(
      ENSRegistry.abi,
      ENSRegistry.bytecode
    );
    const publicResolverFactory = new ContractFactory(
      PublicResolver.abi,
      PublicResolver.bytecode
    );

    const registry = await registryFactory.connect(signer).deploy();
    await registry.deployed();

    const publicResolver = await publicResolverFactory
      .connect(signer)
      .deploy(registry.address, AddressZero, AddressZero, AddressZero);
    await publicResolver.deployed();

    await registerEnsName(
      '',
      'eth',
      registry,
      await signer.getAddress(),
      publicResolver.address
    );
    return { ensRegistry: registry, ensResolver: publicResolver };
  } catch (e) {
    throw e;
  }
}

async function registerEnsName(
  tld: string,
  name: string,
  registry: Contract,
  owner: string,
  resolver: string
) {
  try {
    await registry.setSubnodeRecord(
      tld !== '' ? namehash(tld) : HashZero,
      id(name),
      owner,
      resolver,
      0
    );
  } catch (e) {
    throw e;
  }
}
