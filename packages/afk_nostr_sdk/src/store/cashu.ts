import {createStore} from 'zustand';

import {Proof} from '@cashu/cashu-ts';
import createBoundedUseStore from './createBoundedUseStore';
import {Contact} from '../types';

interface State {
  publicKey: string;
  privateKey: string;
  isExtension?: boolean;
  nwcUrl?: string;
  mintUrl?: string;

  // Cashu store auth
  isSeedCashuStorage?: boolean;
  seed?: Uint8Array;
  mnemonic?: string;
  mints?: string[];
  mintRequests?: string[];
  proofs?: Proof[];
  useNostr?: boolean;
  pendingTokens?: string[];
  contacts: Contact[];
  activeBalance: number;
}

interface Action {
  setAuth: (publicKey: string, privateKey: string) => void;
  setPublicKey: (publicKey: string) => void;
  setIsExtensionConnect: (isExtension: boolean) => void;

  // Cashu Wallet
  setIsSeedCashuStorage: (isSeedStorage: boolean) => void;
  setMnemonic: (mnemonic: string) => void;
  setSeed: (seed: Uint8Array) => void;

  setMints: (mints: string[]) => void;
  setProofs: (proofs: Proof[]) => void;
  setMintsRequests: (mintRequests: string[]) => void;
  setNWCUrl: (nwcUrl: string) => void;

  setContacts: (contacts: Contact[]) => void;
  setMintUrl: (mintUrl: string) => void;
  setActiveBalance: (balance: number) => void;
}

export const cashuStore = createStore<State & Action>((set) => ({
  // publicKey and privateKey are set to undefined but we know they are strings
  // so we can cast them as strings without hassle in the app
  publicKey: undefined as unknown as string,
  privateKey: undefined as unknown as string,
  nwcUrl: undefined as unknown as string,
  seed: undefined as unknown as Uint8Array,
  mnemonic: undefined as unknown as string,
  mints: undefined as unknown as string[],
  mintRequests: undefined as unknown as string[],
  proofs: undefined as unknown as Proof[],
  contacts: [] as Contact[],
  mintUrl: 'https://mint.minibits.cash/Bitcoin' as unknown as string,
  activeBalance: 0 as unknown as number,

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

  setIsSeedCashuStorage: (isSeedCashuStorage) => {
    set({isSeedCashuStorage});
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
  setProofs: (proofs) => {
    set({proofs});
  },
  setContacts: (contacts) => {
    set({contacts});
  },
  setMintUrl: (mintUrl) => {
    set({mintUrl});
  },
  setActiveBalance: (activeBalance) => {
    set({activeBalance});
  },
}));

export const useCashuStore = createBoundedUseStore(cashuStore);
