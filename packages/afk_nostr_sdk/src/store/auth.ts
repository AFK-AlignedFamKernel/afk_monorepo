import {createStore} from 'zustand';

import createBoundedUseStore from './createBoundedUseStore';

type State = {
  publicKey: string;
  privateKey: string;
  isExtension?: boolean;
  nwcUrl?: string;

  // Cashu store auth
  isSeedStorage?: boolean;
  seed?: Uint8Array;
  mnemonic?: string;
  mints?: string[];
  mintRequests?: string[];
  useNostr?: boolean;
  pendingTokens?:string[];
};

type Action = {
  setAuth: (publicKey: string, privateKey: string) => void;
  setPublicKey: (publicKey: string) => void;
  setIsExtensionConnect: (isExtension: boolean) => void;

  // Cashu Wallet
  setIsSeedStorage:(isSeedStorage:boolean) => void;
  setMnemonic: (mnemonic:string) => void;
  setSeed: (seed:Uint8Array) => void;

  setMints: (mints:string[]) => void;
  setMintsRequests: (mintRequests:string[]) => void;
  setNWCUrl: (nwcUrl:string) => void;
};

export const authStore = createStore<State & Action>((set, get) => ({
  // publicKey and privateKey are set to undefined but we know they are strings
  // so we can cast them as strings without hassle in the app
  publicKey: undefined as unknown as string,
  privateKey: undefined as unknown as string,
  nwcUrl: undefined as unknown as string,
  seed: undefined as unknown as Uint8Array,
  mnemonic: undefined as unknown as string,

  setAuth: (publicKey, privateKey) => {
    set({publicKey, privateKey});
  },
  setNWCUrl: (nwcUrl) => {
    set({nwcUrl});
  },
  setPublicKey: (publicKey) => {
    set({publicKey});
  },
  setIsExtensionConnect: (isExtension) => {
    set({isExtension});
  },

  // Cashu store
  setIsSeedStorage: (isSeedStorage) => {
    set({isSeedStorage});
  },
  setSeed: (seed) => {
    set({seed});
  },
  setMnemonic: (mnemonic) => {
    set({mnemonic});
  },
  setMints: (mints) => {
    set({mints});
  },
  setMintsRequests: (mintRequests) => {
    set({mintRequests});
  },
}));

export const useAuth = createBoundedUseStore(authStore);
