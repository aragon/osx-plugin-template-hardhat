import {ERC165 as ERC165Contract} from '../../generated/PluginSetupProcessor/ERC165';
import {PLUGIN_INTERFACE} from '../utils/constants';
import {supportsInterface} from '../utils/erc165';
import {
  Address,
  Bytes,
  DataSourceContext,
  ethereum,
  crypto,
  ByteArray,
  BigInt,
} from '@graphprotocol/graph-ts';

export const PERMISSION_OPERATIONS = new Map<number, string>()
  .set(0, 'Grant')
  .set(1, 'Revoke')
  .set(2, 'GrantWithCondition');

function createPlugin(plugin: Address, daoId: string): void {
  let packageEntity = Plugin.load(plugin.toHexString());
  if (!packageEntity) {
    packageEntity = new Plugin(plugin.toHexString());
    packageEntity.onlyListed = false;
    packageEntity.pluginAddress = plugin;
    packageEntity.dao = daoId;
    packageEntity.proposalCount = BigInt.zero();

    // Create template
    let context = new DataSourceContext();
    context.setString('daoAddress', daoId);
    Plugin.createWithContext(plugin, context);

    packageEntity.save();
  }
}

export function addPlugin(daoId: string, plugin: Address): void {
  // package
  // TODO: rethink this once the market place is ready
  let contract = ERC165Contract.bind(plugin);

  let tokenVotingInterfaceSupported = supportsInterface(
    contract,
    PLUGIN_INTERFACE
  );

  if (tokenVotingInterfaceSupported) {
    createPlugin(plugin, daoId);
  }
}

export function getPluginInstallationId(
  dao: string,
  plugin: string
): Bytes | null {
  let installationIdTupleArray = new ethereum.Tuple();
  installationIdTupleArray.push(
    ethereum.Value.fromAddress(Address.fromString(dao))
  );
  installationIdTupleArray.push(
    ethereum.Value.fromAddress(Address.fromString(plugin))
  );

  let installationIdTuple = installationIdTupleArray as ethereum.Tuple;
  let installationIdTupleEncoded = ethereum.encode(
    ethereum.Value.fromTuple(installationIdTuple)
  );

  if (installationIdTupleEncoded) {
    return Bytes.fromHexString(
      crypto
        .keccak256(
          ByteArray.fromHexString(installationIdTupleEncoded.toHexString())
        )
        .toHexString()
    );
  }
  return null;
}

export function getPluginVersionId(
  pluginRepo: string,
  release: i32,
  build: i32
): string {
  return pluginRepo
    .concat('_')
    .concat(release.toString())
    .concat('_')
    .concat(build.toString());
}
