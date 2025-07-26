import { create } from 'zustand';
import { 
  algoRelayService, 
  TrendingNote, 
  ViralNote, 
  ScrapedNote, 
  TopAuthor,
  TrendingTopAuthor
} from '@/services/algoRelayService';

interface AlgoRelayState {
  // Data arrays
  trendingNotes: TrendingNote[];
  viralNotes: ViralNote[];
  scrapedNotes: ScrapedNote[];
  topAuthors: TopAuthor[];
  trendingTopAuthors: TrendingTopAuthor[];
  
  // Loading states
  loading: boolean;
  loadingMore: boolean;
  
  // Error state
  error: string | null;
  
  // Pagination
  offset: number;
  limit: number;
  hasMore: boolean;
  
  // Last update
  lastUpdate: Date;
  
  // Actions
  fetchTrendingNotes: (limit?: number, offset?: number, append?: boolean) => Promise<void>;
  fetchViralNotes: (limit?: number, offset?: number, append?: boolean) => Promise<void>;
  fetchScrapedNotes: (limit?: number, offset?: number, append?: boolean) => Promise<void>;
  fetchTopAuthors: (publicKey: string, limit?: number, offset?: number, append?: boolean) => Promise<void>;
  fetchTrendingTopAuthors: (limit?: number, offset?: number, append?: boolean) => Promise<void>;
  
  // Reset actions
  resetTrendingNotes: () => void;
  resetViralNotes: () => void;
  resetScrapedNotes: () => void;
  resetTopAuthors: () => void;
  resetTrendingTopAuthors: () => void;
  
  // Pagination actions
  setOffset: (offset: number) => void;
  setLimit: (limit: number) => void;
  resetPagination: () => void;
  
  // Clear all data
  clearAll: () => void;
}

export const useAlgoRelayStore = create<AlgoRelayState>((set, get) => ({
  // Initial state
  trendingNotes: [],
  viralNotes: [],
  scrapedNotes: [],
  topAuthors: [],
  trendingTopAuthors: [],
  
  loading: false,
  loadingMore: false,
  error: null,
  
  offset: 0,
  limit: 20,
  hasMore: true,
  
  lastUpdate: new Date(),
  
  // Fetch trending notes
  fetchTrendingNotes: async (limit = 20, offset = 0, append = false) => {
    const { loadingMore } = get();
    if (loadingMore) return;
    
    set({ loadingMore: true, error: null });
    
    try {
      const data = await algoRelayService.getTrendingNotes(limit);
      
      set(state => ({
        trendingNotes: append ? [...state.trendingNotes, ...(data || [])] : (data || []),
        hasMore: (data || []).length === limit,
        loadingMore: false,
        lastUpdate: new Date()
      }));
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Failed to fetch trending notes',
        loadingMore: false 
      });
    }
  },
  
  // Fetch viral notes
  fetchViralNotes: async (limit = 20, offset = 0, append = false) => {
    const { loadingMore } = get();
    if (loadingMore) return;
    
    set({ loadingMore: true, error: null });
    
    try {
      const data = await algoRelayService.getViralNotes(limit);
      
      set(state => ({
        viralNotes: append ? [...state.viralNotes, ...(data || [])] : (data || []),
        hasMore: (data || []).length === limit,
        loadingMore: false,
        lastUpdate: new Date()
      }));
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Failed to fetch viral notes',
        loadingMore: false 
      });
    }
  },
  
  // Fetch scraped notes
  fetchScrapedNotes: async (limit = 20, offset = 0, append = false) => {
    const { loadingMore } = get();
    if (loadingMore) return;
    
    set({ loadingMore: true, error: null });
    
    try {
      const data = await algoRelayService.getScrapedNotes({ limit });
      
      set(state => ({
        scrapedNotes: append ? [...state.scrapedNotes, ...(data || [])] : (data || []),
        hasMore: (data || []).length === limit,
        loadingMore: false,
        lastUpdate: new Date()
      }));
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Failed to fetch scraped notes',
        loadingMore: false 
      });
    }
  },
  
  // Fetch top authors
  fetchTopAuthors: async (publicKey: string, limit = 20, offset = 0, append = false) => {
    const { loadingMore } = get();
    if (loadingMore) return;
    
    set({ loadingMore: true, error: null });
    
    try {
      const data = await algoRelayService.getTopAuthors(publicKey);
      
      set(state => ({
        topAuthors: append ? [...state.topAuthors, ...(data || [])] : (data || []),
        hasMore: (data || []).length === limit,
        loadingMore: false,
        lastUpdate: new Date()
      }));
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Failed to fetch top authors',
        loadingMore: false 
      });
    }
  },
  
  // Fetch trending top authors
  fetchTrendingTopAuthors: async (limit = 20, offset = 0, append = false) => {
    const { loadingMore } = get();
    if (loadingMore) return;
    
    set({ loadingMore: true, error: null });
    
    try {
      const data = await algoRelayService.getTrendingTopAuthors({ limit });
      
      set(state => ({
        trendingTopAuthors: append ? [...state.trendingTopAuthors, ...(data || [])] : (data || []),
        hasMore: (data || []).length === limit,
        loadingMore: false,
        lastUpdate: new Date()
      }));
    } catch (err) {
      set({ 
        error: err instanceof Error ? err.message : 'Failed to fetch trending top authors',
        loadingMore: false 
      });
    }
  },
  
  // Reset actions
  resetTrendingNotes: () => set({ trendingNotes: [], offset: 0, hasMore: true }),
  resetViralNotes: () => set({ viralNotes: [], offset: 0, hasMore: true }),
  resetScrapedNotes: () => set({ scrapedNotes: [], offset: 0, hasMore: true }),
  resetTopAuthors: () => set({ topAuthors: [], offset: 0, hasMore: true }),
  resetTrendingTopAuthors: () => set({ trendingTopAuthors: [], offset: 0, hasMore: true }),
  
  // Pagination actions
  setOffset: (offset: number) => set({ offset }),
  setLimit: (limit: number) => set({ limit }),
  resetPagination: () => set({ offset: 0, hasMore: true }),
  
  // Clear all data
  clearAll: () => set({
    trendingNotes: [],
    viralNotes: [],
    scrapedNotes: [],
    topAuthors: [],
    trendingTopAuthors: [],
    offset: 0,
    hasMore: true,
    error: null
  })
})); 