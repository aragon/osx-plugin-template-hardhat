import { MyPluginContext } from "./context";
import {
  IMyPluginClient,
  IMyPluginClientDecoding,
  IMyPluginClientEncoding,
  IMyPluginClientEstimation,
  IMyPluginClientMethods,
  MyPluginClientDecoding,
  MyPluginClientEncoding,
  MyPluginClientMethods,
  SimpleStoragClientEstimation,
} from "./internal";

export class MyPluginClient implements IMyPluginClient {
  public methods: IMyPluginClientMethods;
  public estimation: IMyPluginClientEstimation;
  public encoding: IMyPluginClientEncoding;
  public decoding: IMyPluginClientDecoding;

  constructor(pluginContext: MyPluginContext) {
    this.methods = new MyPluginClientMethods(pluginContext);
    this.estimation = new SimpleStoragClientEstimation(pluginContext);
    this.encoding = new MyPluginClientEncoding(pluginContext);
    this.decoding = new MyPluginClientDecoding(pluginContext);
  }
}
