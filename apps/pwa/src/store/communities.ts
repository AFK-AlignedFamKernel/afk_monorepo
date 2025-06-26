import { create } from 'zustand';
import { ICommunity } from '@/types';

interface CommunitiesState {
  communities:ICommunity[] ; 
  setCommunities: (communities: ICommunity[] ) => void;
}

  export const useCommunitiesStore = create<CommunitiesState>((set) => ({
  communities: [],
  setCommunities: (communities: ICommunity[]) => set({ communities }),
})); 