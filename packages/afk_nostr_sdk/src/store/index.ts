import {create} from 'zustand';

type State = {
  relays: string[];
  addRelay: (relay: string) => void;
  removeRelay: (relay: string) => void;
  setRelays: (relays: string[]) => void;
  isConnected: boolean;
  setIsConnected: (isConnected: boolean) => void;
};

export const useSettingsStore = create<State>((set) => ({
  relays: [],
  addRelay: (relay) => set((state) => ({relays: [...state.relays, relay]})),
  removeRelay: (relay) =>
    set((state) => ({relays: state.relays.filter((r) => r !== relay)})),
  setRelays: (relays) => set({relays}),
  isConnected: false,
  setIsConnected: (isConnected) => set({isConnected}),
})); 