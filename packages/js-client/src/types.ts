import {
  ContextParams,
  ContextState,
  OverridenState,
} from "@aragon/sdk-client-common";

// TODO
// import from @aragon/sdk-client-common
// type OverriddenState = {
//   daoFactoryAddress: boolean;
//   ensRegistryAddress: boolean;
//   gasFeeEstimationFactor: boolean;
//   ipfsNodes: boolean;
//   graphqlNodes: boolean;
// };

export type SimpleStorageContextState = ContextState & {
  // extend the Context state with a new state for storing
  // the new parameters
  myParam: string;
};

export type SimpleStorageOverridenState = OverridenState & {
  myParam: boolean;
};

export type SimpleStorageContextParams = ContextParams & {
  // optional so we can set default values for the parameter
  myParam?: string;
  // add custom params
};
