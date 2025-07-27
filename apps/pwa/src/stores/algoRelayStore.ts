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
  
  // Push data actions (for real-time updates)
  pushTrendingNotes: (notes: TrendingNote[]) => void;
  pushViralNotes: (notes: ViralNote[]) => void;
  pushScrapedNotes: (notes: ScrapedNote[]) => void;
  pushTopAuthors: (authors: TopAuthor[]) => void;
  pushTrendingTopAuthors: (authors: TrendingTopAuthor[]) => void;
  
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
  
  // Utility functions for checking data existence
  hasTrendingNote: (noteId: string) => boolean;
  hasViralNote: (noteId: string) => boolean;
  hasScrapedNote: (noteId: string) => boolean;
  hasTopAuthor: (pubkey: string) => boolean;
  hasTrendingTopAuthor: (pubkey: string) => boolean;
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
    if (loadingMore) {
      console.log('Already loading, skipping fetchTrendingNotes');
      return;
    }
    
    set({ loadingMore: true, error: null });
    
    try {
      const data = await algoRelayService.getTrendingNotes(limit, offset);
      console.log(`Fetched ${data?.length || 0} trending notes, append: ${append}`);
      
      set(state => {
        if (append) {
          // Remove duplicates when appending
          const existingIds = new Set(state.trendingNotes.map(note => note.id));
          const newNotes = (data || []).filter(note => !existingIds.has(note.id));
          const combinedNotes = [...state.trendingNotes, ...newNotes];
          
          console.log(`Appending ${newNotes.length} new trending notes (${data?.length || 0} total received, ${existingIds.size} existing)`);
          
          return {
            trendingNotes: combinedNotes,
            hasMore: newNotes.length === limit,
            loadingMore: false,
            lastUpdate: new Date()
          };
        } else {
          console.log(`Setting ${data?.length || 0} trending notes (fresh load)`);
          return {
            trendingNotes: (data || []),
            hasMore: (data || []).length === limit,
            loadingMore: false,
            lastUpdate: new Date()
          };
        }
      });
    } catch (err) {
      console.error('Error fetching trending notes:', err);
      set({ 
        error: err instanceof Error ? err.message : 'Failed to fetch trending notes',
        loadingMore: false 
      });
    }
  },
  
  // Fetch viral notes
  fetchViralNotes: async (limit = 20, offset = 0, append = false) => {
    const { loadingMore } = get();
    if (loadingMore) {
      console.log('Already loading, skipping fetchViralNotes');
      return;
    }
    
    set({ loadingMore: true, error: null });
    
    try {
      const data = await algoRelayService.getViralNotes(limit, offset);
      console.log(`Fetched ${data?.length || 0} viral notes, append: ${append}`);
      
      set(state => {
        if (append) {
          // Remove duplicates when appending
          const existingIds = new Set(state.viralNotes.map(note => note.id));
          const newNotes = (data || []).filter(note => !existingIds.has(note.id));
          const combinedNotes = [...state.viralNotes, ...newNotes];
          
          console.log(`Appending ${newNotes.length} new viral notes (${data?.length || 0} total received, ${existingIds.size} existing)`);
          
          return {
            viralNotes: combinedNotes,
            hasMore: newNotes.length === limit,
            loadingMore: false,
            lastUpdate: new Date()
          };
        } else {
          console.log(`Setting ${data?.length || 0} viral notes (fresh load)`);
          return {
            viralNotes: (data || []),
            hasMore: (data || []).length === limit,
            loadingMore: false,
            lastUpdate: new Date()
          };
        }
      });
    } catch (err) {
      console.error('Error fetching viral notes:', err);
      set({ 
        error: err instanceof Error ? err.message : 'Failed to fetch viral notes',
        loadingMore: false 
      });
    }
  },
  
  // Fetch scraped notes
  fetchScrapedNotes: async (limit = 20, offset = 0, append = false) => {
    const { loadingMore } = get();
    if (loadingMore) {
      console.log('Already loading, skipping fetchScrapedNotes');
      return;
    }
    
    set({ loadingMore: true, error: null });
    
    try {
      const data = await algoRelayService.getScrapedNotes({ limit, offset });
      console.log(`Fetched ${data?.length || 0} scraped notes, append: ${append}`);
      
      set(state => {
        if (append) {
          // Remove duplicates when appending
          const existingIds = new Set(state.scrapedNotes.map(note => note.id));
          const newNotes = (data || []).filter(note => !existingIds.has(note.id));
          const combinedNotes = [...state.scrapedNotes, ...newNotes];
          
          console.log(`Appending ${newNotes.length} new scraped notes (${data?.length || 0} total received, ${existingIds.size} existing)`);
          
          return {
            scrapedNotes: combinedNotes,
            hasMore: newNotes.length === limit,
            loadingMore: false,
            lastUpdate: new Date()
          };
        } else {
          console.log(`Setting ${data?.length || 0} scraped notes (fresh load)`);
          return {
            scrapedNotes: (data || []),
            hasMore: (data || []).length === limit,
            loadingMore: false,
            lastUpdate: new Date()
          };
        }
      });
    } catch (err) {
      console.error('Error fetching scraped notes:', err);
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
  
  // Push data actions (for real-time updates)
  pushTrendingNotes: (notes: TrendingNote[]) => {
    set(state => {
      const existingIds = new Set(state.trendingNotes.map(note => note.id));
      const newNotes = notes.filter(note => !existingIds.has(note.id));
      const combinedNotes = [...newNotes, ...state.trendingNotes]; // New notes at the top
      
      return {
        trendingNotes: combinedNotes,
        lastUpdate: new Date()
      };
    });
  },
  
  pushViralNotes: (notes: ViralNote[]) => {
    set(state => {
      const existingIds = new Set(state.viralNotes.map(note => note.id));
      const newNotes = notes.filter(note => !existingIds.has(note.id));
      const combinedNotes = [...newNotes, ...state.viralNotes]; // New notes at the top
      
      return {
        viralNotes: combinedNotes,
        lastUpdate: new Date()
      };
    });
  },
  
  pushScrapedNotes: (notes: ScrapedNote[]) => {
    set(state => {
      const existingIds = new Set(state.scrapedNotes.map(note => note.id));
      const newNotes = notes.filter(note => !existingIds.has(note.id));
      const combinedNotes = [...newNotes, ...state.scrapedNotes]; // New notes at the top
      
      return {
        scrapedNotes: combinedNotes,
        lastUpdate: new Date()
      };
    });
  },
  
  pushTopAuthors: (authors: TopAuthor[]) => {
    set(state => {
      const existingIds = new Set(state.topAuthors.map(author => author.pubkey));
      const newAuthors = authors.filter(author => !existingIds.has(author.pubkey));
      const combinedAuthors = [...newAuthors, ...state.topAuthors]; // New authors at the top
      
      return {
        topAuthors: combinedAuthors,
        lastUpdate: new Date()
      };
    });
  },
  
  pushTrendingTopAuthors: (authors: TrendingTopAuthor[]) => {
    set(state => {
      const existingIds = new Set(state.trendingTopAuthors.map(author => author.pubkey));
      const newAuthors = authors.filter(author => !existingIds.has(author.pubkey));
      const combinedAuthors = [...newAuthors, ...state.trendingTopAuthors]; // New authors at the top
      
      return {
        trendingTopAuthors: combinedAuthors,
        lastUpdate: new Date()
      };
    });
  },
  
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
  }),
  
  // Utility functions for checking data existence
  hasTrendingNote: (noteId: string) => {
    const state = get();
    return state.trendingNotes.some(note => note.id === noteId);
  },
  
  hasViralNote: (noteId: string) => {
    const state = get();
    return state.viralNotes.some(note => note.id === noteId);
  },
  
  hasScrapedNote: (noteId: string) => {
    const state = get();
    return state.scrapedNotes.some(note => note.id === noteId);
  },
  
  hasTopAuthor: (pubkey: string) => {
    const state = get();
    return state.topAuthors.some(author => author.pubkey === pubkey);
  },
  
  hasTrendingTopAuthor: (pubkey: string) => {
    const state = get();
    return state.trendingTopAuthors.some(author => author.pubkey === pubkey);
  }
})); 