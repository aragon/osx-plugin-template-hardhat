import { ContextParams } from '@aragon/sdk-client-common';

export type SimpleStorageContextParams = ContextParams & {
  // optional so we can set default values for the parameter
  myParam?: string;
  // add custom params
};
