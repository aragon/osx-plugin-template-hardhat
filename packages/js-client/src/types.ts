import {
  ContextParams,
  Pagination,
  VersionTag,
} from '@aragon/sdk-client-common';

// Parameters to pass to the Context constructor
export type MyPluginContextParams = ContextParams & {
  // Those with a default value are optional

  myPluginAddress: string;
  myPluginRepoAddress: string;
  // add custom params here
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
  NUMBER = 'number',
  CREATED_AT = 'createdAt',
}

export type NumberListItem = {
  id: string;
  subdomain: string;
  value: bigint;
};
