// TODO: Remove this file and import from OSx-commons-subgraph,
// once the OSx-commons-subgraph npm package is published
import {
  Address,
  Bytes,
  ethereum,
  crypto,
  ByteArray,
} from '@graphprotocol/graph-ts';

export function generatePluginInstallationEntityId(
  dao: Address,
  plugin: Address
): Bytes | null {
  const installationIdTupleArray = new ethereum.Tuple();
  installationIdTupleArray.push(ethereum.Value.fromAddress(dao));
  installationIdTupleArray.push(ethereum.Value.fromAddress(plugin));

  const installationIdTuple = installationIdTupleArray as ethereum.Tuple;
  const installationIdTupleEncoded = ethereum.encode(
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
