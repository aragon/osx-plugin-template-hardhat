import {Deployment} from './deploy-contracts';
import * as aragonContracts from '@aragon/osx-ethers';
import {AddressZero} from '@ethersproject/constants';
import {id} from '@ethersproject/hash';
import {defaultAbiCoder} from 'ethers/lib/utils';

export async function createDao(
  daoFactory: aragonContracts.DAOFactory,
  daoSettings: aragonContracts.DAOFactory.DAOSettingsStruct,
  pluginSettings: aragonContracts.DAOFactory.PluginSettingsStruct[]
): Promise<{dao: string; plugins: string[]}> {
  const tx = await daoFactory.createDao(daoSettings, pluginSettings);
  const receipt = await tx.wait();
  const registryInterface =
    aragonContracts.DAORegistry__factory.createInterface();
  const registeredLog = receipt.logs.find(
    log =>
      log.topics[0] ===
      id(registryInterface.getEvent('DAORegistered').format('sighash'))
  );

  const pluginSetupProcessorInterface =
    aragonContracts.PluginSetupProcessor__factory.createInterface();
  const installedLogs = receipt.logs.filter(
    log =>
      log.topics[0] ===
      id(
        pluginSetupProcessorInterface
          .getEvent('InstallationApplied')
          .format('sighash')
      )
  );
  if (!registeredLog) {
    throw new Error('Failed to find log');
  }

  const registeredParsed = registryInterface.parseLog(registeredLog);
  return {
    dao: registeredParsed.args[0],
    plugins: installedLogs.map(
      log => pluginSetupProcessorInterface.parseLog(log).args[1]
    ),
  };
}

export async function buildMyPluginDao(deployment: Deployment) {
  try {
    const latestVersion = await deployment.myPluginRepo[
      'getLatestVersion(address)'
    ](deployment.myPluginSetup.address);
    return await createDao(
      deployment.daoFactory,
      {
        metadata: '0x',
        subdomain: 'test-' + Math.floor(Math.random() * 10000),
        trustedForwarder: AddressZero,
        daoURI: 'ipfs://...',
      },
      [
        {
          pluginSetupRef: {
            pluginSetupRepo: deployment.myPluginRepo.address,
            versionTag: latestVersion.tag,
          },
          data: defaultAbiCoder.encode(['uint256'], [1]),
        },
      ]
    );
  } catch (e) {
    throw e;
  }
}
