import { SimpleStorage__factory } from "@aragon/todo-plugin-ethers";
import { SimpleStorageClientCore } from "../../core";
import { ISimpleStorageClientDecoding } from "../interfaces";

export class SimpleStorageClientDecoding extends SimpleStorageClientCore
  implements ISimpleStorageClientDecoding {
  public storeNumberAction(data: Uint8Array): bigint {
    const iface = SimpleStorage__factory.createInterface();
    const res = iface.decodeFunctionData("storeNumber", data);
    return BigInt(res[0]);
  }
}
