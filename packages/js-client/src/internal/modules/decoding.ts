import { ClientCore } from "@aragon/sdk-client-common";
import { ISimpleStorageClientDecoding } from "../interfaces";

export class SimpleStorageClientDecoding extends ClientCore
  implements ISimpleStorageClientDecoding {
  // implementation of the methods in the interface
  public myAction() {
    console.warn("Method not implemented.");
  }
}
