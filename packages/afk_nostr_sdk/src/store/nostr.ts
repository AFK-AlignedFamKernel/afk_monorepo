import {createStore} from 'zustand';
import {NDKEvent} from '@nostr-dev-kit/ndk';
import createBoundedUseStore from './createBoundedUseStore';

type State = {
  notes: NDKEvent[];
  // profiles: NDKEvent[];
};

type Action = {
  setNotes: (notes: NDKEvent[]) => void;
};

const getDefaultValue = () => {
  return {
    notes:[]
  };
};
export const nostrStore = createStore<State & Action>((set, get) => ({
  notes: getDefaultValue().notes,
  setNotes: (notes) => {
    set({notes});
  },
}));

export const useNostrStore = createBoundedUseStore(nostrStore);
