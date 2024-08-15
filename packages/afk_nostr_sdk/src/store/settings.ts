import {createStore} from 'zustand';

import createBoundedUseStore from './createBoundedUseStore';
import { AFK_RELAYS } from '../utils/relay';

type State = {
  relays: string[];
};

type Action = {
  setRelays: (relays:string[]) => void;
};

export const settingsStore = createStore<State & Action>((set, get) => ({
  relays: undefined as unknown as string[],
  setRelays: (relays) => {
    set({relays});
  },
}));

export const useSettingsStore = createBoundedUseStore(settingsStore);
