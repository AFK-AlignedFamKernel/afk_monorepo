import { Proof } from '@cashu/cashu-ts';
import { createStore } from 'zustand';

import createBoundedUseStore from './createBoundedUseStore';
import { UserShareProps } from '../components/LaunchPad/UserShare';
import { TokenDeployInterface, TokenLaunchInterface } from '../types/keys';

type State = {
  userShare?: UserShareProps
  userShares?: UserShareProps[]
  tokens?: TokenDeployInterface[]
  launchs?: TokenLaunchInterface[]
};

type Action = {
  setUserShares: (userShares: UserShareProps[]) => void;
  setUserShare: (userShares: UserShareProps) => void;
  setTokens: (tokens: TokenDeployInterface[]) => void;
  setLaunchs: (launchs: TokenLaunchInterface[]) => void;
};

export const launchpadStore = createStore<State & Action>((set, get) => ({
  // publicKey and privateKey are set to undefined but we know they are strings
  // so we can cast them as strings without hassle in the app
  userShare: undefined as unknown as UserShareProps,
  userShares: undefined as unknown as UserShareProps[],
  tokens: undefined as unknown as TokenDeployInterface[],
  launchs: undefined as unknown as TokenLaunchInterface[],


  setUserShare: (userShare) => {
    set({ userShare });
  },
  setUserShares: (userShares) => {
    set({ userShares });
  },
  setTokens: (tokens) => {
    set({ tokens });
  },
  setLaunchs: (launchs) => {
    set({ launchs });
  },
}));

export const useLaunchpadStore = createBoundedUseStore(launchpadStore);
