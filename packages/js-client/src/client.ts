import { ClientCore } from "@aragon/sdk-client-common";
import {
  ISimpleStorageClient,
  ISimpleStorageClientDecoding,
  ISimpleStorageClientEncoding,
  ISimpleStorageClientEstimation,
  ISimpleStorageClientMethods,
  SimpleStoragClientEstimation,
  SimpleStorageClientDecoding,
  SimpleStorageClientEncoding,
  SimpleStorageClientMethods,
} from "./internal";
import { SimpleStorageContext } from "./context";

export class SimpleStorageClient extends ClientCore
  implements ISimpleStorageClient {
  public methods: ISimpleStorageClientMethods;
  public estimation: ISimpleStorageClientEstimation;
  public encoding: ISimpleStorageClientEncoding;
  public decoding: ISimpleStorageClientDecoding;

  constructor(context: SimpleStorageContext) {
    super(context);
    this.methods = new SimpleStorageClientMethods(context);
    this.estimation = new SimpleStoragClientEstimation(context);
    this.encoding = new SimpleStorageClientEncoding(context);
    this.decoding = new SimpleStorageClientDecoding(context);
  }
}
