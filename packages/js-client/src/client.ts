import { MyPluginContext } from './context';
import {
  IMyPluginClient,
  IMyPluginClientDecoding,
  IMyPluginClientEncoding,
  IMyPluginClientEstimation,
  IMyPluginClientMethods,
  SimpleStoragClientEstimation,
  MyPluginClientDecoding,
  MyPluginClientEncoding,
  MyPluginClientMethods,
} from './internal';
import { MyPluginClientCore } from './internal/core';

export class MyPluginClient
  extends MyPluginClientCore
  implements IMyPluginClient
{
  public methods: IMyPluginClientMethods;
  public estimation: IMyPluginClientEstimation;
  public encoding: IMyPluginClientEncoding;
  public decoding: IMyPluginClientDecoding;

  constructor(pluginContext: MyPluginContext) {
    super(pluginContext);
    this.methods = new MyPluginClientMethods(pluginContext);
    this.estimation = new SimpleStoragClientEstimation(pluginContext);
    this.encoding = new MyPluginClientEncoding(pluginContext);
    this.decoding = new MyPluginClientDecoding(pluginContext);
  }
}
