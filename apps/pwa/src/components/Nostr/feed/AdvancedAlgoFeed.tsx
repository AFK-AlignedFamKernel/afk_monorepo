'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from 'afk_nostr_sdk';
import { logClickedEvent } from '@/lib/analytics';
import { algoRelayService, TrendingNote, ViralNote, ScrapedNote, TopAuthor } from '@/services/algoRelayService';
import styles from '@/styles/nostr/algo-feed.module.scss';

interface AdvancedAlgoFeedProps {
  className?: string;
  limit?: number;
  showTrending?: boolean;
  showViral?: boolean;
  showScraped?: boolean;
  showTopAuthors?: boolean;
  enableRealTime?: boolean;
}

type FeedTab = 'trending' | 'viral' | 'scraped' | 'top-authors';

const AdvancedAlgoFeed: React.FC<AdvancedAlgoFeedProps> = ({
  className = '',
  limit = 20,
  showTrending = true,
  showViral = true,
  showScraped = true,
  showTopAuthors = true,
  enableRealTime = false
}) => {
  const { publicKey } = useAuth();
  const [activeTab, setActiveTab] = useState<FeedTab>('trending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data states
  const [trendingNotes, setTrendingNotes] = useState<TrendingNote[]>([]);
  const [viralNotes, setViralNotes] = useState<ViralNote[]>([]);
  const [scrapedNotes, setScrapedNotes] = useState<ScrapedNote[]>([]);
  const [topAuthors, setTopAuthors] = useState<TopAuthor[]>([]);
  
  // Filter states
  const [selectedKind, setSelectedKind] = useState<number | null>(null);
  const [timeFilter, setTimeFilter] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [sortBy, setSortBy] = useState<'score' | 'reactions' | 'zaps' | 'replies' | 'created'>('score');
  
  // Real-time updates
  const wsRef = useRef<WebSocket | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Get available tabs based on props
  const getAvailableTabs = (): FeedTab[] => {
    const tabs: FeedTab[] = [];
    if (showTrending) tabs.push('trending');
    if (showViral) tabs.push('viral');
    if (showScraped) tabs.push('scraped');
    if (showTopAuthors) tabs.push('top-authors');
    return tabs;
  };

  const availableTabs = getAvailableTabs();

  // Fetch functions
  const fetchTrendingNotes = useCallback(async () => {
    try {
      const data = await algoRelayService.getTrendingNotes(limit);
      console.log('Trending notes response:', data); // Debug log
      setTrendingNotes(data || []);
    } catch (err) {
      console.error('Error fetching trending notes:', err);
      setError('Failed to fetch trending notes');
      setTrendingNotes([]);
    }
  }, [limit]);

  const fetchViralNotes = useCallback(async () => {
    try {
      const data = await algoRelayService.getViralNotesScraper(limit);
      console.log('Viral notes response:', data); // Debug log
      setViralNotes(data || []);
    } catch (err) {
      console.error('Error fetching viral notes:', err);
      setError('Failed to fetch viral notes');
      setViralNotes([]);
    }
  }, [limit]);

  const fetchScrapedNotes = useCallback(async () => {
    try {
      const since = getTimeFilterDate(timeFilter);
      const data = await algoRelayService.getScrapedNotes({
        limit,
        kind: selectedKind || undefined,
        since: since.toISOString()
      });
      console.log('Scraped notes response:', data); // Debug log
      setScrapedNotes(data || []);
    } catch (err) {
      console.error('Error fetching scraped notes:', err);
      setError('Failed to fetch scraped notes');
      setScrapedNotes([]);
    }
  }, [limit, selectedKind, timeFilter]);

  const fetchTopAuthors = useCallback(async () => {
    if (!publicKey) return;
    
    try {
      const data = await algoRelayService.getTopAuthors(publicKey);
      console.log('Top authors response:', data); // Debug log
      setTopAuthors(data || []);
    } catch (err) {
      console.error('Error fetching top authors:', err);
      setError('Failed to fetch top authors');
      setTopAuthors([]);
    }
  }, [publicKey]);

  // Utility functions
  const getTimeFilterDate = (filter: string): Date => {
    const now = new Date();
    switch (filter) {
      case '1h': return new Date(now.getTime() - 60 * 60 * 1000);
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  };

  const sortNotes = <T extends TrendingNote | ViralNote | ScrapedNote>(notes: T[]): T[] => {
    return [...notes].sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return ((b as any).score || (b as any).viral_score || 0) - ((a as any).score || (a as any).viral_score || 0);
        case 'reactions':
          return (b.reaction_count || 0) - (a.reaction_count || 0);
        case 'zaps':
          return (b.zap_count || 0) - (a.zap_count || 0);
        case 'replies':
          return (b.reply_count || 0) - (a.reply_count || 0);
        case 'created':
          return b.created_at - a.created_at;
        default:
          return 0;
      }
    });
  };

  // Load data based on active tab
  const loadTabData = useCallback(async () => {
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
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, fetchTrendingNotes, fetchViralNotes, fetchScrapedNotes, fetchTopAuthors]);

  // Refresh current tab
  const refreshCurrentTab = useCallback(async () => {
    setRefreshing(true);
    await loadTabData();
    setRefreshing(false);
    setLastUpdate(new Date());
  }, [loadTabData]);

  // WebSocket for real-time updates
  useEffect(() => {
    if (!enableRealTime) return;

    const connectWebSocket = () => {
      try {
        wsRef.current = algoRelayService.connectWebSocket(
          (data) => {
            // Handle real-time updates
            if (data.type === 'new_note' && activeTab === 'trending') {
              refreshCurrentTab();
            }
          },
          (error) => {
            console.error('WebSocket error:', error);
          }
        );
      } catch (err) {
        console.error('Failed to connect WebSocket:', err);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [enableRealTime, activeTab, refreshCurrentTab]);

  // Load data when tab changes or filters change
  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  // Event handlers
  const handleTabChange = (tab: FeedTab) => {
    setActiveTab(tab);
    logClickedEvent('advanced_algo_feed_tab', 'click_tab', tab);
  };

  const handleNoteClick = (note: TrendingNote | ViralNote | ScrapedNote) => {
    logClickedEvent('advanced_algo_feed_note', 'click_note', note.id);
    // Add your note click handler here
  };

  const handleAuthorClick = (author: TopAuthor) => {
    logClickedEvent('advanced_algo_feed_author', 'click_author', author.pubkey);
    // Add your author click handler here
  };

  // Render functions
  const renderNoteCard = (note: TrendingNote | ViralNote | ScrapedNote) => (
    <div 
      key={note.id} 
      className={styles['algo-feed__note-card']}
      onClick={() => handleNoteClick(note)}
    >
      <div className={styles['algo-feed__note-header']}>
        <img 
          src={algoRelayService.getAuthorAvatar(note)} 
          alt={algoRelayService.getAuthorDisplayName(note)}
          className={styles['algo-feed__author-avatar']}
        />
        <div className={styles['algo-feed__author-info']}>
          <span className={styles['algo-feed__author-name']}>
            {algoRelayService.getAuthorDisplayName(note)}
          </span>
          <span className={styles['algo-feed__timestamp']}>
            {algoRelayService.formatTimestamp(note.created_at)}
          </span>
        </div>
        {(note as any).score && (
          <div className={styles['algo-feed__score']}>
            <span className={styles['algo-feed__score-value']}>
              {(note as any).score?.toFixed(1) || (note as any).viral_score?.toFixed(1) || '0.0'}
            </span>
          </div>
        )}
      </div>
      <div className={styles['algo-feed__note-content']}>
        {note.content}
      </div>
      <div className={styles['algo-feed__note-stats']}>
        {note.reaction_count && (
          <span className={styles['algo-feed__stat']}>
            ❤️ {note.reaction_count}
          </span>
        )}
        {note.zap_count && (
          <span className={styles['algo-feed__stat']}>
            ⚡ {note.zap_count}
          </span>
        )}
        {note.reply_count && (
          <span className={styles['algo-feed__stat']}>
            💬 {note.reply_count}
          </span>
        )}
      </div>
    </div>
  );

  const renderFilters = () => (
    <div className={styles['algo-feed__filters']}>
      <div className={styles['algo-feed__filter-group']}>
        <label className={styles['algo-feed__filter-label']}>Time:</label>
        <select 
          value={timeFilter} 
          onChange={(e) => setTimeFilter(e.target.value as any)}
          className={styles['algo-feed__filter-select']}
        >
          <option value="1h">Last Hour</option>
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>
      
      <div className={styles['algo-feed__filter-group']}>
        <label className={styles['algo-feed__filter-label']}>Sort by:</label>
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value as any)}
          className={styles['algo-feed__filter-select']}
        >
          <option value="score">Score</option>
          <option value="reactions">Reactions</option>
          <option value="zaps">Zaps</option>
          <option value="replies">Replies</option>
          <option value="created">Created</option>
        </select>
      </div>

      {activeTab === 'scraped' && (
        <div className={styles['algo-feed__filter-group']}>
          <label className={styles['algo-feed__filter-label']}>Kind:</label>
          <select 
            value={selectedKind || ''} 
            onChange={(e) => setSelectedKind(e.target.value ? parseInt(e.target.value) : null)}
            className={styles['algo-feed__filter-select']}
          >
            <option value="">All</option>
            <option value="1">Text Notes</option>
            <option value="30023">Articles</option>
            <option value="6">Reposts</option>
            <option value="7">Reactions</option>
          </select>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className={styles['algo-feed__loading']}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles['algo-feed__skeleton']}>
              <div className={styles['algo-feed__skeleton-avatar']}></div>
              <div className={styles['algo-feed__skeleton-content']}>
                <div className={styles['algo-feed__skeleton-line']}></div>
                <div className={styles['algo-feed__skeleton-line']}></div>
                <div className={styles['algo-feed__skeleton-line-short']}></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles['algo-feed__error']}>
          <p>{error}</p>
          <button 
            onClick={refreshCurrentTab}
            className={styles['algo-feed__retry-button']}
          >
            Retry
          </button>
        </div>
      );
    }

          switch (activeTab) {
        case 'trending':
          return (
            <div className={styles['algo-feed__notes']}>
              {(!trendingNotes || trendingNotes.length === 0) ? (
                <div className={styles['algo-feed__empty']}>
                  <p>No trending notes found</p>
                </div>
              ) : (
                sortNotes(trendingNotes).map(renderNoteCard)
              )}
            </div>
          );
        case 'viral':
          return (
            <div className={styles['algo-feed__notes']}>
              {(!viralNotes || viralNotes.length === 0) ? (
                <div className={styles['algo-feed__empty']}>
                  <p>No viral notes found</p>
                </div>
              ) : (
                sortNotes(viralNotes).map(renderNoteCard)
              )}
            </div>
          );
        case 'scraped':
          return (
            <div className={styles['algo-feed__notes']}>
              {(!scrapedNotes || scrapedNotes.length === 0) ? (
                <div className={styles['algo-feed__empty']}>
                  <p>No scraped notes found</p>
                </div>
              ) : (
                sortNotes(scrapedNotes).map(renderNoteCard)
              )}
            </div>
          );
        case 'top-authors':
          return (
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
                onClick={() => handleAuthorClick(author)}
              >
                <img 
                  src={algoRelayService.getAuthorAvatar(author)} 
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
      default:
        return null;
    }
  };

  return (
    <div className={`${styles['algo-feed']} ${styles['algo-feed--advanced']} ${className}`}>
      <div className={styles['algo-feed__header']}>
        <div className={styles['algo-feed__header-top']}>
          <h2 className={styles['algo-feed__title']}>Advanced Algorithmic Feed</h2>
          <div className={styles['algo-feed__header-actions']}>
            <button
              onClick={refreshCurrentTab}
              disabled={refreshing}
              className={styles['algo-feed__refresh-button']}
            >
              {refreshing ? '🔄' : '🔄'}
            </button>
            {enableRealTime && (
              <span className={styles['algo-feed__realtime-indicator']}>
                ⚡ Live
              </span>
            )}
          </div>
        </div>
        
        <div className={styles['algo-feed__tabs']}>
          {availableTabs.map((tab) => (
            <button
              key={tab}
              className={`${styles['algo-feed__tab']} ${activeTab === tab ? styles['algo-feed__tab--active'] : ''}`}
              onClick={() => handleTabChange(tab)}
            >
              <span className={styles['algo-feed__tab-icon']}>
                {tab === 'trending' ? '🔥' : 
                 tab === 'viral' ? '🚀' : 
                 tab === 'scraped' ? '📊' : '👥'}
              </span>
              {tab === 'top-authors' ? 'Top Authors' : 
               tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab !== 'top-authors' && renderFilters()}
      </div>

      <div className={styles['algo-feed__content']}>
        {renderContent()}
      </div>

      {lastUpdate && (
        <div className={styles['algo-feed__footer']}>
          <span className={styles['algo-feed__last-update']}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default AdvancedAlgoFeed; 