import { useCallback } from 'react';
import { useAlgoRelayStore } from '@/stores/algoRelayStore';

export type TabType = 'trending' | 'viral' | 'scraped' | 'top-authors' | 'trending-top-authors';

export const useAlgoFeedData = (activeTab: TabType, limit: number, publicKey?: string) => {
  const {
    trendingNotes,
    viralNotes,
    scrapedNotes,
    topAuthors,
    trendingTopAuthors,
    loading,
    loadingMore,
    error,
    hasMore,
    lastUpdate,
    fetchTrendingNotes,
    fetchViralNotes,
    fetchScrapedNotes,
    fetchTopAuthors,
    fetchTrendingTopAuthors,
    resetTrendingNotes,
    resetViralNotes,
    resetScrapedNotes,
    resetTopAuthors,
    resetTrendingTopAuthors,
    setOffset,
    resetPagination
  } = useAlgoRelayStore();

  const getCurrentData = () => {
    switch (activeTab) {
      case 'trending':
        return trendingNotes;
      case 'viral':
        return viralNotes;
      case 'scraped':
        return scrapedNotes;
      case 'top-authors':
        return topAuthors;
      case 'trending-top-authors':
        return trendingTopAuthors;
      default:
        return [];
    }
  };

  const fetchCurrentTabData = useCallback(async (append = false) => {
    try {
      let currentOffset = 0;
      if (append) {
        // Get current state to calculate offset
        const state = useAlgoRelayStore.getState();
        switch (activeTab) {
          case 'trending':
            currentOffset = state.trendingNotes.length;
            break;
          case 'viral':
            currentOffset = state.viralNotes.length;
            break;
          case 'scraped':
            currentOffset = state.scrapedNotes.length;
            break;
          case 'top-authors':
            currentOffset = state.topAuthors.length;
            break;
          case 'trending-top-authors':
            currentOffset = state.trendingTopAuthors.length;
            break;
        }
      }
      
      console.log('fetchCurrentTabData called with:', { append, currentOffset, limit, activeTab });
      
      switch (activeTab) {
        case 'trending':
          await fetchTrendingNotes(limit, currentOffset, append);
          break;
        case 'viral':
          await fetchViralNotes(limit, currentOffset, append);
          break;
        case 'scraped':
          await fetchScrapedNotes(limit, currentOffset, append);
          break;
        case 'top-authors':
          if (publicKey) {
            await fetchTopAuthors(publicKey, limit, currentOffset, append);
          }
          break;
        case 'trending-top-authors':
          await fetchTrendingTopAuthors(limit, currentOffset, append);
          break;
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, [activeTab, limit, publicKey, fetchTrendingNotes, fetchViralNotes, fetchScrapedNotes, fetchTopAuthors, fetchTrendingTopAuthors]);

  return {
    getCurrentData,
    fetchCurrentTabData,
    loading,
    loadingMore,
    error,
    hasMore,
    lastUpdate,
    resetPagination
  };
}; 