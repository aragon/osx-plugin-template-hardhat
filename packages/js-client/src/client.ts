import { SimpleStorageContext } from './context';
import { SimpleStorageClientCore } from './core';
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
} from './internal';

export class SimpleStorageClient
  extends SimpleStorageClientCore
  implements ISimpleStorageClient
{
  public methods: ISimpleStorageClientMethods;
  public estimation: ISimpleStorageClientEstimation;
  public encoding: ISimpleStorageClientEncoding;
  public decoding: ISimpleStorageClientDecoding;

  constructor(pluginContext: SimpleStorageContext) {
    super(pluginContext);
    this.methods = new SimpleStorageClientMethods(pluginContext);
    this.estimation = new SimpleStoragClientEstimation(pluginContext);
    this.encoding = new SimpleStorageClientEncoding(pluginContext);
    this.decoding = new SimpleStorageClientDecoding(pluginContext);
  }
}
