import { create } from 'zustand';
import { ToastType } from '../components/Toast/Toast';
import { Session, User } from '@supabase/supabase-js';
import { ILaunch } from '../types/token';
import { IBrand, IContentCreator, ILeaderboardStats } from '@/types/brand';

interface BrandState {
  myContentCreatorProfile:IContentCreator | null;
  setMyContentCreatorProfile: (myContentCreatorProfile: IContentCreator | null) => void;
  brand:IBrand | null;
  setBrand: (brand: IBrand | null) => void;
  brands:IBrand[] | null;
  setBrands: (brands: IBrand[] | null) => void;
  contentCreators:IContentCreator[] | null;
  setContentCreators: (contentCreators: IContentCreator[] | null) => void;
  contentCreator:IContentCreator | null;
  setContentCreator: (contentCreator: IContentCreator | null) => void;
  leaderboardStats:ILeaderboardStats[] | null;
  setLeaderboardStats: (leaderboardStats: ILeaderboardStats[] | null) => void;
  isInitialFetchBrand: boolean;
  setIsInitialFetchBrand: (isInitialFetchBrand: boolean) => void;
  isInitialFetchContentCreator: boolean;
  setIsInitialFetchContentCreator: (isInitialFetchContentCreator: boolean) => void;
  isInitialFetchLeaderboardStats: boolean;
  setIsInitialFetchLeaderboardStats: (isInitialFetchLeaderboardStats: boolean) => void;
}

export const useBrandStore = create<BrandState>((set) => ({
  myContentCreatorProfile: null,
  setMyContentCreatorProfile: (myContentCreatorProfile: IContentCreator | null) => set({ myContentCreatorProfile }),
  brand: null,
  leaderboardStats: null,
  setLeaderboardStats: (leaderboardStats: ILeaderboardStats[] | null) => set({ leaderboardStats }),
  isInitialFetchLeaderboardStats: false,
  setIsInitialFetchLeaderboardStats: (isInitialFetchLeaderboardStats: boolean) => set({ isInitialFetchLeaderboardStats }),
  isInitialFetchBrand: false,
  setIsInitialFetchBrand: (isInitialFetchBrand: boolean) => set({ isInitialFetchBrand }),
  isInitialFetchContentCreator: false,
  setIsInitialFetchContentCreator: (isInitialFetchContentCreator: boolean) => set({ isInitialFetchContentCreator }),
  setBrand: (brand: IBrand | null) => set({ brand }),
  brands: null,
  setBrands: (brands: IBrand[] | null) => set({ brands }),
  contentCreators: null,
  setContentCreators: (contentCreators: IContentCreator[] | null) => set({ contentCreators }),
  contentCreator: null,
  setContentCreator: (contentCreator: IContentCreator | null) => set({ contentCreator }),
})); 