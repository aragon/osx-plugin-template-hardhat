import { ClientCore } from "@aragon/sdk-client-common";
import { ISimpleStorageClientEstimation } from "../interfaces";

export class SimpleStoragClientEstimation extends ClientCore
  implements ISimpleStorageClientEstimation {
  // implementation of the methods in the interface
  public myMethod() {
    console.warn("Method not implemented.");
  }
}
