export interface ISimpleStorageClient {
  methods: ISimpleStorageClientMethods;
  estimation: ISimpleStorageClientEstimation;
  encoding: ISimpleStorageClientEncoding;
  decoding: ISimpleStorageClientDecoding;
}

export interface ISimpleStorageClientMethods {
  // fill with methods
  myMethod(): void;
}
export interface ISimpleStorageClientEstimation {
  // fill with methods for estimation
  myMethod(): void;
}
export interface ISimpleStorageClientEncoding {
  // fill with methods for encoding actions
  myAction(): void;
}
export interface ISimpleStorageClientDecoding {
  // fill with methods for decoding actions
  myAction(): void;
}
