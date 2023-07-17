import {
  ContextParams,
  ContextState,
  Pagination,
  OverriddenState,
  VersionTag,
} from "@aragon/sdk-client-common";


export type SimpleStorageContextState = ContextState & {
  // extend the Context state with a new state for storing
  // the new parameters
  simpleStoragePluginAddress: string;
  simpleStorageRepoAddress: string;
};

export type SimpleStorageOverriddenState = OverriddenState & {
  simpleStoragePluginAddress: boolean;
  simpleStorageRepoAddress: boolean;
};

export type SimpleStorageContextParams = ContextParams & {
  // optional so we can set default values for the parameter
  simpleStoragePluginAddress?: string;
  simpleStorageRepoAddress?: string;
  // add custom params
};

export type PrepareInstallationParams = {
  daoAddressOrEns: string;
  version?: VersionTag;
  settings: {
    number: bigint;
  };
};

export type NumbersQueryParams = Pagination & {
  sortBy?: NumbersSortBy;
  daoAddressOrEns?: string;
};

export enum NumbersSortBy {
  NUMBER = "number",
  CREATED_AT = "createdAt",
}

export type NumberListItem = {
  id: string;
  subdomain: string;
  value: bigint;
}
