import {
  NumberListItem,
  NumbersQueryParams,
  PrepareInstallationParams,
} from '../types';
import { StoreNumberStepValue } from './types';
import {
  DaoAction,
  GasFeeEstimation,
  PluginInstallItem,
  PrepareInstallationStepValue,
} from '@aragon/sdk-client-common';
import { Networkish } from '@ethersproject/providers';

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
  storeNumber(newNumber: bigint): AsyncGenerator<StoreNumberStepValue>;
}
export interface IMyPluginClientEstimation {
  prepareInstallation(
    params: PrepareInstallationParams
  ): Promise<GasFeeEstimation>;
  storeNumber(newNumber: bigint): Promise<GasFeeEstimation>;
}
export interface IMyPluginClientEncoding {
  getPluginInstallItem(
    params: PrepareInstallationParams,
    network: Networkish
  ): PluginInstallItem;
  storeNumberAction(number: bigint): DaoAction;
}
export interface IMyPluginClientDecoding {
  storeNumberAction(data: Uint8Array): bigint;
}
