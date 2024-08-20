import {createStore} from 'zustand';

import createBoundedUseStore from './createBoundedUseStore';

type State = {
  publicKey: string;
  privateKey: string;
  isExtension?:boolean;
};

type Action = {
  setAuth: (publicKey: string, privateKey: string) => void;
  setPublicKey: (publicKey: string) => void;
  setIsExtensionConnect: (isExtension: boolean) => void;
};

export const authStore = createStore<State & Action>((set, get) => ({
  // publicKey and privateKey are set to undefined but we know they are strings
  // so we can cast them as strings without hassle in the app
  publicKey: undefined as unknown as string,
  privateKey: undefined as unknown as string,

  setAuth: (publicKey, privateKey) => {
    set({publicKey, privateKey});
  },
  setPublicKey: (publicKey) => {
    set({publicKey});
  },
  setIsExtensionConnect: (isExtension) => {
    set({isExtension:isExtension});
  },
}));

export const useAuth = createBoundedUseStore(authStore);
