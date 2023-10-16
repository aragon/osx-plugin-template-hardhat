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

export type MyPluginContextState = ContextState & {
  // extend the Context state with a new state for storing
  // the new parameters
  myPluginAddress: string;
  myPluginRepoAddress: string;
};

export type MyPluginOverriddenState = OverriddenState & {
  [key in keyof MyPluginContextState]: boolean;
};

export enum StoreNumberStep {
  SETTING = 'setting',
  DONE = 'done',
}
export type StoreNumberStepValue =
  | {
      status: StoreNumberStep.SETTING;
      txHash: string;
    }
  | {
      status: StoreNumberStep.DONE;
    };
