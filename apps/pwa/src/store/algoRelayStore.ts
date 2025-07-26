import { create } from 'zustand';
import { ToastType } from '../components/Toast/Toast';
import { Session, User } from '@supabase/supabase-js';
import { ILaunch } from '../types/token';
import { TrendingNote, ViralNote, ScrapedNote, TopAuthor, TrendingTopAuthor } from '@/services/algoRelayService';

interface AlgoRelayState {

  notes: TrendingNote[] | ViralNote[] | ScrapedNote[] | TopAuthor[] | TrendingTopAuthor[];
  setNotes: (notes: TrendingNote[] | ViralNote[] | ScrapedNote[] | TopAuthor[] | TrendingTopAuthor[]) => void;

  isInitialFetchNotes: boolean;
  setIsInitialFetchNotes: (isInitialFetchNotes: boolean) => void;

  isInitialFetchTopAuthors: boolean;
  setIsInitialFetchTopAuthors: (isInitialFetchTopAuthors: boolean) => void;

  isInitialFetchTrendingTopAuthors: boolean;
  setIsInitialFetchTrendingTopAuthors: (isInitialFetchTrendingTopAuthors: boolean) => void;

  isInitialFetchTrending: boolean;
  setIsInitialFetchTrending: (isInitialFetchTrending: boolean) => void;

  isInitialFetchViral: boolean;
  setIsInitialFetchViral: (isInitialFetchViral: boolean) => void;

}

export const useAlgoRelayStore = create<AlgoRelayState>((set) => ({
  notes: [],
  setNotes: (notes: TrendingNote[] | ViralNote[] | ScrapedNote[] | TopAuthor[] | TrendingTopAuthor[]) => set({ notes }),
  isInitialFetchNotes: false,
  setIsInitialFetchNotes: (isInitialFetchNotes: boolean) => set({ isInitialFetchNotes }),
  isInitialFetchTopAuthors: false,
  setIsInitialFetchTopAuthors: (isInitialFetchTopAuthors: boolean) => set({ isInitialFetchTopAuthors }),
  isInitialFetchTrendingTopAuthors: false,
  setIsInitialFetchTrendingTopAuthors: (isInitialFetchTrendingTopAuthors: boolean) => set({ isInitialFetchTrendingTopAuthors }),
  isInitialFetchTrending: false,
  setIsInitialFetchTrending: (isInitialFetchTrending: boolean) => set({ isInitialFetchTrending }),
  isInitialFetchViral: false,
  setIsInitialFetchViral: (isInitialFetchViral: boolean) => set({ isInitialFetchViral }),
})); 