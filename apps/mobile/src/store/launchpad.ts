import {createStore} from 'zustand';

import {UserShareProps} from '../components/LaunchPad/UserShare';
import {LaunchDataMerged, TokenDeployInterface} from '../types/keys';
import createBoundedUseStore from './createBoundedUseStore';

type State = {
  userShare?: UserShareProps;
  userShares?: UserShareProps[];
  tokens?: TokenDeployInterface[];
  launches?: LaunchDataMerged[];
  myTokens?: TokenDeployInterface[];
  myLaunches?: LaunchDataMerged[];
};

type Action = {
  setUserShares: (userShares: UserShareProps[]) => void;
  setUserShare: (userShares: UserShareProps) => void;
  setTokens: (tokens: TokenDeployInterface[]) => void;
  setLaunches: (launches: LaunchDataMerged[]) => void;
  setMyTokens: (myTokens: TokenDeployInterface[]) => void;
  setMyLaunches: (myLaunches: LaunchDataMerged[]) => void;
};

export const launchpadStore = createStore<State & Action>((set, get) => ({
  // publicKey and privateKey are set to undefined but we know they are strings
  // so we can cast them as strings without hassle in the app
  userShare: undefined as unknown as UserShareProps,
  userShares: undefined as unknown as UserShareProps[],
  tokens: undefined as unknown as TokenDeployInterface[],
  launches: undefined as unknown as LaunchDataMerged[],

  setUserShare: (userShare) => {
    set({userShare});
  },
  setUserShares: (userShares) => {
    set({userShares});
  },
  setTokens: (tokens) => {
    set({tokens});
  },
  setLaunches: (launches) => {
    set({launches});
  },
  seyMyLaunches: (myLaunches) => {
    set({myLaunches});
  },
  seyMyTokens: (myTokens) => {
    set({myTokens});
  },
}));

export const useLaunchpadStore = createBoundedUseStore(launchpadStore);
