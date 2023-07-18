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

export interface ISimpleStorageClient {
  methods: ISimpleStorageClientMethods;
  estimation: ISimpleStorageClientEstimation;
  encoding: ISimpleStorageClientEncoding;
  decoding: ISimpleStorageClientDecoding;
}

export interface ISimpleStorageClientMethods {
  // fill with methods
  prepareInstallation(
    params: PrepareInstallationParams
  ): AsyncGenerator<PrepareInstallationStepValue>;
  getNumber(daoAddressOrEns: string): Promise<bigint>;
  getNumbers(params: NumbersQueryParams): Promise<NumberListItem[]>;
}
export interface ISimpleStorageClientEstimation {
  prepareInstallation(
    params: PrepareInstallationParams
  ): Promise<GasFeeEstimation>;
}
export interface ISimpleStorageClientEncoding {
  storeNumberAction(number: bigint): DaoAction;
}
export interface ISimpleStorageClientDecoding {
  storeNumberAction(data: Uint8Array): bigint;
}
