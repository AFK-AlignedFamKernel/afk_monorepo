import {Proof} from '@cashu/cashu-ts';
import {createStore} from 'zustand';

import createBoundedUseStore from './createBoundedUseStore';

type State = {
  publicKey: string;
  privateKey: string;
  isExtension?: boolean;
  nwcUrl?: string;
  isNostrAuthed?:boolean;

  // Cashu store auth
  isSeedCashuStorage?: boolean;
  seed?: Uint8Array;
  mnemonic?: string;
  mints?: string[];
  mintRequests?: string[];
  proofs?: Proof[];
  useNostr?: boolean;
  pendingTokens?: string[];

  evmPublicKey?: string;
  evmPrivateKey?: string;
  strkPublicKey?: string;
  strkPrivateKey?: string;
};

type Action = {
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
  setEVMWallet: (evmPublicKey?: string, evmPrivateKey?: string) => void;
  setStrkWallet: (strkPublicKey?: string, strkPrivateKey?: string) => void;
  setIsNostrAuthed: (isNostrAuthed: boolean) => void;
};

export const authStore = createStore<State & Action>((set, get) => ({
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
  strkPrivateKey: undefined as unknown as string,
  strkPublicKey: undefined as unknown as string,
  evmPublicKey: undefined as unknown as string,
  evmPrivateKey: undefined as unknown as string,
  isNostrAuthed: false,

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

  // Wallet
  setEVMWallet: (evmPublicKey, evmPrivateKey) => {
    set({evmPublicKey, evmPrivateKey});
  },
  setStrkWallet: (strkPublicKey, strkPrivateKey) => {
    set({strkPrivateKey, strkPublicKey});
  },
  setIsNostrAuthed: (isNostrAuthed) => {
    set({isNostrAuthed});
  },
}));

export const useAuth = createBoundedUseStore(authStore);
