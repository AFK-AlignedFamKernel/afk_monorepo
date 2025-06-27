import { create } from 'zustand';
import { ICommunity } from '@/types';

interface CommunitiesState {
  isInitialLoad: boolean;
  setIsInitialLoad: (isInitialLoad: boolean) => void;
  community: ICommunity | null;
  setCommunity: (community: ICommunity) => void;
  communities:ICommunity[] ; 
  setCommunities: (communities: ICommunity[] ) => void;
}

  export const useCommunitiesStore = create<CommunitiesState>((set) => ({
  isInitialLoad: true,
  setIsInitialLoad: (isInitialLoad: boolean) => set({ isInitialLoad }),
    communities: [],
  setCommunities: (communities: ICommunity[]) => set({ communities }),
  community: null,
  setCommunity: (community: ICommunity) => set({ community }),
})); 