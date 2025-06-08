import { create } from 'zustand';
import { ToastType } from '../components/Toast/Toast';
import { Session, User } from '@supabase/supabase-js';
import { ILaunch } from '../types/token';
import { ICreatorAnalytics, IBrand, IContentCreator, ILeaderboardStats } from '@/types/brand';

interface CreatorsState {
  myContentCreatorProfile:IContentCreator | null;
  setMyContentCreatorProfile: (myContentCreatorProfile: IContentCreator | null) => void;
  contentCreators:IContentCreator[] | null;
  setContentCreators: (contentCreators: IContentCreator[] | null) => void;
  contentCreator:IContentCreator | null;
  setContentCreator: (contentCreator: IContentCreator | null) => void;
  creatorAnalytics:ICreatorAnalytics[] | null;
  setCreatorAnalytics: (creatorAnalytics: ICreatorAnalytics[] | null) => void;
  isInitialFetchContentCreator: boolean;
  setIsInitialFetchContentCreator: (isInitialFetchContentCreator: boolean) => void;
  isInitialFetchCreatorAnalytics: boolean;
  setIsInitialFetchCreatorAnalytics: (isInitialFetchCreatorAnalytics: boolean) => void;
}

export const useCreatorsStore = create<CreatorsState>((set) => ({
  myContentCreatorProfile: null,
  setMyContentCreatorProfile: (myContentCreatorProfile: IContentCreator | null) => set({ myContentCreatorProfile }),
  isInitialFetchCreatorAnalytics: false,
  setIsInitialFetchCreatorAnalytics: (isInitialFetchCreatorAnalytics: boolean) => set({ isInitialFetchCreatorAnalytics }),
  isInitialFetchContentCreator: false,
  setIsInitialFetchContentCreator: (isInitialFetchContentCreator: boolean) => set({ isInitialFetchContentCreator }),
  contentCreators: null,
  setContentCreators: (contentCreators: IContentCreator[] | null) => set({ contentCreators }),
  contentCreator: null,
  setContentCreator: (contentCreator: IContentCreator | null) => set({ contentCreator }),
  creatorAnalytics: null,
  setCreatorAnalytics: (creatorAnalytics: ICreatorAnalytics[] | null) => set({ creatorAnalytics }),
})); 