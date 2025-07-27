'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from 'afk_nostr_sdk';
import { logClickedEvent } from '@/lib/analytics';
import { 
  algoRelayService, 
  TrendingNote, 
  ViralNote, 
  ScrapedNote, 
  TopAuthor,
  TrendingTopAuthor,
  transformTrendingNoteToNDKEvent,
  transformViralNoteToNDKEvent,
  transformScrapedNoteToNDKEvent
} from '@/services/algoRelayService';
import { PostEventCard } from '@/components/Nostr/EventCard/PostEventCard';
import styles from '@/styles/nostr/algo-feed.module.scss';

interface AdvancedAlgoFeedProps {
  className?: string;
  limit?: number;
  showTrending?: boolean;
  showViral?: boolean;
  showScraped?: boolean;
  showTopAuthors?: boolean;
  showTrendingTopAuthors?: boolean;
  enableRealTime?: boolean;
}

type TabType = 'trending' | 'viral' | 'scraped' | 'top-authors' | 'trending-top-authors';

const AdvancedAlgoFeed: React.FC<AdvancedAlgoFeedProps> = ({
  className = '',
  limit = 20,
  showTrending = true,
  showViral = true,
  showScraped = true,
  showTopAuthors = true,
  showTrendingTopAuthors = true,
  enableRealTime = false
}) => {
  const { publicKey } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('trending');
  const [trendingNotes, setTrendingNotes] = useState<TrendingNote[]>([]);
  const [viralNotes, setViralNotes] = useState<ViralNote[]>([]);
  const [scrapedNotes, setScrapedNotes] = useState<ScrapedNote[]>([]);
  const [topAuthors, setTopAuthors] = useState<TopAuthor[]>([]);
  const [trendingTopAuthors, setTrendingTopAuthors] = useState<TrendingTopAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchTrendingNotes = useCallback(async () => {
    try {
      const data = await algoRelayService.getTrendingNotes(limit);
      setTrendingNotes(data || []);
    } catch (err) {
      console.error('Error fetching trending notes:', err);
      setTrendingNotes([]);
    }
  }, [limit]);

  const fetchViralNotes = useCallback(async () => {
    try {
      const data = await algoRelayService.getViralNotes(limit);
      setViralNotes(data || []);
    } catch (err) {
      console.error('Error fetching viral notes:', err);
      setViralNotes([]);
    }
  }, [limit]);

  const fetchScrapedNotes = useCallback(async () => {
    try {
      const data = await algoRelayService.getScrapedNotes({ limit });
      setScrapedNotes(data || []);
    } catch (err) {
      console.error('Error fetching scraped notes:', err);
      setScrapedNotes([]);
    }
  }, [limit]);

  const fetchTopAuthors = useCallback(async () => {
    if (!publicKey) return;
    
    try {
      const data = await algoRelayService.getTopAuthors(publicKey);
      setTopAuthors(data || []);
    } catch (err) {
      console.error('Error fetching top authors:', err);
      setTopAuthors([]);
    }
  }, [publicKey]);

  const fetchTrendingTopAuthors = useCallback(async () => {
    try {
      const data = await algoRelayService.getTrendingTopAuthors({ limit });
      setTrendingTopAuthors(data || []);
    } catch (err) {
      console.error('Error fetching trending top authors:', err);
      setTrendingTopAuthors([]);
    }
  }, [limit]);

  const fetchCurrentTabData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      switch (activeTab) {
        case 'trending':
          await fetchTrendingNotes();
          break;
        case 'viral':
          await fetchViralNotes();
          break;
        case 'scraped':
          await fetchScrapedNotes();
          break;
        case 'top-authors':
          await fetchTopAuthors();
          break;
        case 'trending-top-authors':
          await fetchTrendingTopAuthors();
          break;
      }
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, fetchTrendingNotes, fetchViralNotes, fetchScrapedNotes, fetchTopAuthors, fetchTrendingTopAuthors]);

  useEffect(() => {
    fetchCurrentTabData();
  }, [fetchCurrentTabData]);

  // Real-time updates
  useEffect(() => {
    if (!enableRealTime) return;

    const interval = setInterval(() => {
      fetchCurrentTabData();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [enableRealTime, fetchCurrentTabData]);

  const handleRefresh = async () => {
    logClickedEvent('advanced_algo_feed_refresh', 'click_refresh', activeTab);
    await fetchCurrentTabData();
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    logClickedEvent('advanced_algo_feed_tab', 'click_tab', tab);
  };

  const renderNotes = (notes: TrendingNote[] | ViralNote[] | ScrapedNote[] | TopAuthor[] | TrendingTopAuthor[]) => {
    if (loading) {
      return (
        <div className={styles['algo-feed__loading']}>
          <div className={styles['algo-feed__skeleton']}>
            <div className={styles['algo-feed__skeleton-avatar']}></div>
            <div className={styles['algo-feed__skeleton-content']}>
              <div className={styles['algo-feed__skeleton-line']}></div>
              <div className={styles['algo-feed__skeleton-line']}></div>
              <div className={styles['algo-feed__skeleton-line-short']}></div>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles['algo-feed__error']}>
          <p>{error}</p>
          <button 
            onClick={fetchCurrentTabData}
            className={styles['algo-feed__retry-button']}
          >
            Retry
          </button>
        </div>
      );
    }

    if (!notes || notes.length === 0) {
      return (
        <div className={styles['algo-feed__empty']}>
          <p>No {activeTab} data found</p>
        </div>
      );
    }

    return notes.map((note) => {
      let ndkEvent;
      
      switch (activeTab) {
        case 'trending':
          ndkEvent = transformTrendingNoteToNDKEvent(note as TrendingNote);
          break;
        case 'viral':
          ndkEvent = transformViralNoteToNDKEvent(note as ViralNote);
          break;
        case 'scraped':
          ndkEvent = transformScrapedNoteToNDKEvent(note as ScrapedNote);
          break;
        default:
          return null;
      }

      return (
        <div key={note.id} className={styles['algo-feed__note-wrapper']}>
          <PostEventCard 
            event={ndkEvent}
            profile={ndkEvent.profile}
            className={styles['algo-feed__post-card']}
          />
        </div>
      );
    });
  };

  const renderTopAuthors = () => (
    <div className={styles['algo-feed__authors']}>
      {(!topAuthors || topAuthors.length === 0) ? (
        <div className={styles['algo-feed__empty']}>
          <p>No top authors found</p>
        </div>
      ) : (
        topAuthors.map((author) => (
          <div 
            key={author.pubkey} 
            className={styles['algo-feed__author-card']}
          >
            <img 
              src={author.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.pubkey}`} 
              alt={author.name || 'Author'}
              className={styles['algo-feed__author-avatar']}
            />
            <div className={styles['algo-feed__author-details']}>
              <span className={styles['algo-feed__author-name']}>
                {author.name || author.pubkey.slice(0, 8) + '...'}
              </span>
              <span className={styles['algo-feed__interaction-count']}>
                {author.interaction_count} interactions
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderTrendingTopAuthors = () => (
    <div className={styles['algo-feed__trending-authors']}>
      {(!trendingTopAuthors || trendingTopAuthors.length === 0) ? (
        <div className={styles['algo-feed__empty']}>
          <p>No trending top authors found</p>
        </div>
      ) : (
        trendingTopAuthors.map((author) => (
          <div 
            key={author.pubkey} 
            className={styles['algo-feed__trending-author-card']}
          >
            <img 
              src={author.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.pubkey}`} 
              alt={author.name || 'Author'}
              className={styles['algo-feed__author-avatar']}
            />
            <div className={styles['algo-feed__trending-author-details']}>
              <span className={styles['algo-feed__author-name']}>
                {author.name || author.pubkey.slice(0, 8) + '...'}
              </span>
              <div className={styles['algo-feed__trending-author-stats']}>
                <span className={styles['algo-feed__engagement-score']}>
                  🔥 {author.engagement_score.toFixed(1)} engagement
                </span>
                <span className={styles['algo-feed__interaction-breakdown']}>
                  ❤️ {author.reactions_received} • ⚡ {author.zaps_received} • 💬 {author.replies_received}
                </span>
                <span className={styles['algo-feed__notes-count']}>
                  📝 {author.notes_count} notes
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

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

  return (
    <div className={`${styles['algo-feed']} ${className}`}>
      <div className={styles['algo-feed__header']}>
        <div className={styles['algo-feed__header-top']}>
          <h2 className={styles['algo-feed__title']}>Advanced Algorithmic Feed</h2>
          <div className={styles['algo-feed__header-controls']}>
            <span className={styles['algo-feed__last-update']}>
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className={styles['algo-feed__refresh-button']}
              title="Refresh feed"
            >
              <svg 
                className={`${styles['algo-feed__refresh-icon']} ${loading ? styles['algo-feed__refresh-icon--spinning'] : ''}`}
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M23 4v6h-6"/>
                <path d="M1 20v-6h6"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div className={styles['algo-feed__tabs']}>
          {showTrending && (
            <button
              className={`${styles['algo-feed__tab']} ${activeTab === 'trending' ? styles['algo-feed__tab--active'] : ''}`}
              onClick={() => handleTabChange('trending')}
            >
              <span className={styles['algo-feed__tab-icon']}>🔥</span>
              Trending ({trendingNotes.length})
            </button>
          )}
          {showViral && (
            <button
              className={`${styles['algo-feed__tab']} ${activeTab === 'viral' ? styles['algo-feed__tab--active'] : ''}`}
              onClick={() => handleTabChange('viral')}
            >
              <span className={styles['algo-feed__tab-icon']}>🚀</span>
              Viral ({viralNotes.length})
            </button>
          )}
          {showScraped && (
            <button
              className={`${styles['algo-feed__tab']} ${activeTab === 'scraped' ? styles['algo-feed__tab--active'] : ''}`}
              onClick={() => handleTabChange('scraped')}
            >
              <span className={styles['algo-feed__tab-icon']}>📊</span>
              Scraped ({scrapedNotes.length})
            </button>
          )}
          {showTopAuthors && (
            <button
              className={`${styles['algo-feed__tab']} ${activeTab === 'top-authors' ? styles['algo-feed__tab--active'] : ''}`}
              onClick={() => handleTabChange('top-authors')}
            >
              <span className={styles['algo-feed__tab-icon']}>👥</span>
              My Authors ({topAuthors.length})
            </button>
          )}
          {showTrendingTopAuthors && (
            <button
              className={`${styles['algo-feed__tab']} ${activeTab === 'trending-top-authors' ? styles['algo-feed__tab--active'] : ''}`}
              onClick={() => handleTabChange('trending-top-authors')}
            >
              <span className={styles['algo-feed__tab-icon']}>⭐</span>
              Trending Authors ({trendingTopAuthors.length})
            </button>
          )}
        </div>
      </div>

      <div className={styles['algo-feed__content']}>
        {activeTab === 'top-authors' ? renderTopAuthors() : 
         activeTab === 'trending-top-authors' ? renderTrendingTopAuthors() : 
         renderNotes(getCurrentData())}
      </div>
    </div>
  );
};

export default AdvancedAlgoFeed; 