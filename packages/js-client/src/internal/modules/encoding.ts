import { DaoAction } from "@aragon/sdk-client-common";
import { ISimpleStorageClientEncoding } from "../interfaces";
import { SimpleStorage__factory } from "@aragon/todo-plugin-ethers";
import { hexToBytes } from "@aragon/sdk-common";
import { SimpleStorageClientCore } from "../../core";

export class SimpleStorageClientEncoding extends SimpleStorageClientCore
  implements ISimpleStorageClientEncoding {
  // implementation of the methods in the interface
  public storeNumberAction(number: bigint): DaoAction {
    const iface = SimpleStorage__factory.createInterface();
    const data = iface.encodeFunctionData("storeNumber", [number]);
    return {
      to: this.simpleStoragePluginAddress,
      value: BigInt(0),
      data: hexToBytes(data),
    };
  }
}
