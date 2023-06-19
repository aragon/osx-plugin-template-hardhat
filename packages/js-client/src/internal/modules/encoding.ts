import { ClientCore } from "@aragon/sdk-client-common";
import { ISimpleStorageClientEncoding } from "../interfaces";

export class SimpleStorageClientEncoding extends ClientCore
  implements ISimpleStorageClientEncoding {
  // implementation of the methods in the interface
  public myAction() {
    console.warn("Method not implemented.");
  }
}
