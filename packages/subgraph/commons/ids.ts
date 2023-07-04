import {InstallationPrepared} from '../generated/PluginSetupProcessor/PluginSetupProcessor';
import {Plugin, PluginPermission, PluginPreparation} from '../generated/schema';
import {Plugin as PluginTemplate} from '../generated/templates';
import {
  Address,
  Bytes,
  DataSourceContext,
  BigInt,
  log,
  ethereum,
  crypto,
  ByteArray,
} from '@graphprotocol/graph-ts';

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
