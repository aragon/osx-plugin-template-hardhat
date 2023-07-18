import { ContextState, OverriddenState } from '@aragon/sdk-client-common';

export type SubgraphNumberListItem = {
  id: string;
  subdomain: string;
  number: {
    value: string;
  };
};

export type SubgraphNumber = {
  number: {
    value: string;
  };
};

export type SimpleStorageContextState = ContextState & {
  // extend the Context state with a new state for storing
  // the new parameters
  simpleStoragePluginAddress: string;
  simpleStorageRepoAddress: string;
};

export type SimpleStorageOverriddenState = OverriddenState & {
  [key in keyof SimpleStorageContextState]: boolean;
};
