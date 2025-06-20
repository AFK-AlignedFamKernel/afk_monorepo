import {createStore} from 'zustand';

import {AFK_RELAYS} from '../utils/relay';
import createBoundedUseStore from './createBoundedUseStore';

type State = {
  relays: string[];
  isConnected: boolean;
};

type Action = {
  setRelays: (relays: string[]) => void;
  setIsConnected: (isConnected: boolean) => void;
};

const getDefaultValue = () => {
  return {
    relays: AFK_RELAYS,
    isConnected: false,
  };
};
export const settingsStore = createStore<State & Action>((set, get) => ({
  // relays: undefined as unknown as string[],
  relays: getDefaultValue().relays,
  isConnected: getDefaultValue().isConnected,
  setRelays: (relays) => {
    set({relays});
  },
  setIsConnected: (isConnected) => {
    set({isConnected});
  },
}));

export const useSettingsStore = createBoundedUseStore(settingsStore);
