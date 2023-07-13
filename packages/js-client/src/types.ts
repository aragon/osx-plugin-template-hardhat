import {
  ContextParams,
  ContextState,
  // OverridenState,
  VersionTag,
} from "@aragon/sdk-client-common";

// TODO
// import from @aragon/sdk-client-common
type OverridenState = {
  daoFactoryAddress: boolean;
  ensRegistryAddress: boolean;
  gasFeeEstimationFactor: boolean;
  ipfsNodes: boolean;
  graphqlNodes: boolean;
  simpleStoragePluginAdddress: boolean;
  simpleStorageRepoAdddress: boolean;
};

export type SimpleStorageContextState = ContextState & {
  // extend the Context state with a new state for storing
  // the new parameters
  simpleStoragePluginAddress: string;
  simpleStorageRepoAddress: string;
};

export type SimpleStorageOverridenState = OverridenState & {
  simpleStoragePluginAddress: boolean;
  simpleStorageRepoAddress: boolean;
};

export type SimpleStorageContextParams = ContextParams & {
  // optional so we can set default values for the parameter
  simpleStoragePluginAddress?: string;
  simpleStorageRepoAddress?: string;
  // add custom params
};

export type StoreNumberStepValue = {
  key: StoreNumberStep.STORING;
  txHash: string;
} | {
  key: StoreNumberStep.DONE;
  txHash: string;
};

export enum StoreNumberStep {
  STORING = "storing",
  DONE = "done",
}

export type PrepareInstallationParams = {
  daoAddressOrEns: string;
  version?: VersionTag;
  settings: {
    number: bigint;
  };
};
