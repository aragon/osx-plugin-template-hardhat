import {
  NumberListItem,
  NumbersQueryParams,
  PrepareInstallationParams,
} from '../types';
import {
  DaoAction,
  GasFeeEstimation,
  PrepareInstallationStepValue,
} from '@aragon/sdk-client-common';

export interface IMyPluginClient {
  methods: IMyPluginClientMethods;
  estimation: IMyPluginClientEstimation;
  encoding: IMyPluginClientEncoding;
  decoding: IMyPluginClientDecoding;
}

export interface IMyPluginClientMethods {
  // fill with methods
  prepareInstallation(
    params: PrepareInstallationParams
  ): AsyncGenerator<PrepareInstallationStepValue>;
  getNumber(daoAddressOrEns: string): Promise<bigint>;
  getNumbers(params: NumbersQueryParams): Promise<NumberListItem[]>;
}
export interface IMyPluginClientEstimation {
  prepareInstallation(
    params: PrepareInstallationParams
  ): Promise<GasFeeEstimation>;
}
export interface IMyPluginClientEncoding {
  storeNumberAction(number: bigint): DaoAction;
}
export interface IMyPluginClientDecoding {
  storeNumberAction(data: Uint8Array): bigint;
}
