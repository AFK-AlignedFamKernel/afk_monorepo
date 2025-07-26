'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from 'afk_nostr_sdk';
import { logClickedEvent } from '@/lib/analytics';
import { algoRelayService, TrendingNote, TopAuthor } from '@/services/algoRelayService';
import styles from '@/styles/nostr/algo-feed.module.scss';



interface AlgoFeedProps {
  className?: string;
  limit?: number;
  showTrending?: boolean;
  showTopAuthors?: boolean;
}

const AlgoFeed: React.FC<AlgoFeedProps> = ({
  className = '',
  limit = 20,
  showTrending = true,
  showTopAuthors = true
}) => {
  const { publicKey } = useAuth();
  const [trendingNotes, setTrendingNotes] = useState<TrendingNote[]>([]);
  const [topAuthors, setTopAuthors] = useState<TopAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'trending' | 'top-authors'>('trending');

  const fetchTrendingNotes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await algoRelayService.getTrendingNotes(limit);
      console.log('Trending notes response:', data); // Debug log
      // Handle null/undefined data
      setTrendingNotes(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trending notes');
      console.error('Error fetching trending notes:', err);
      setTrendingNotes([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const fetchTopAuthors = useCallback(async () => {
    if (!publicKey) return;
    
    try {
      const data = await algoRelayService.getTopAuthors(publicKey);
      // Handle null/undefined data
      setTopAuthors(data || []);
    } catch (err) {
      console.error('Error fetching top authors:', err);
      setTopAuthors([]); // Set empty array on error
    }
  }, [publicKey]);

  useEffect(() => {
    fetchTrendingNotes();
    if (showTopAuthors) {
      fetchTopAuthors();
    }
  }, [fetchTrendingNotes, fetchTopAuthors, showTopAuthors]);

  const formatTimestamp = (timestamp: number) => {
    return algoRelayService.formatTimestamp(timestamp);
  };

  const getAuthorName = (note: TrendingNote) => {
    return algoRelayService.getAuthorDisplayName(note);
  };

  const getAuthorPicture = (note: TrendingNote) => {
    return algoRelayService.getAuthorAvatar(note);
  };

  const handleNoteClick = (note: TrendingNote) => {
    logClickedEvent('algo_feed_note', 'click_note', note.id);
    // Add your note click handler here
  };

  const handleAuthorClick = (author: TopAuthor) => {
    logClickedEvent('algo_feed_author', 'click_author', author.pubkey);
    // Add your author click handler here
  };

  const handleRefresh = async () => {
    logClickedEvent('algo_feed_refresh', 'click_refresh', activeTab);
    setLoading(true);
    setError(null);
    
    try {
      if (activeTab === 'trending') {
        await fetchTrendingNotes();
      } else if (activeTab === 'top-authors') {
        await fetchTopAuthors();
      }
    } catch (err) {
      console.error('Error refreshing feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderTrendingNotes = () => (
    <div className={styles['algo-feed__notes']}>
      {loading ? (
        <div className={styles['algo-feed__loading']}>
          <div className={styles['algo-feed__skeleton']}>
            <div className={styles['algo-feed__skeleton-avatar']}></div>
            <div className={styles['algo-feed__skeleton-content']}>
              <div className={styles['algo-feed__skeleton-line']}></div>
              <div className={styles['algo-feed__skeleton-line']}></div>
              <div className={styles['algo-feed__skeleton-line-short']}></div>
            </div>
          </div>
          <div className={styles['algo-feed__skeleton']}>
            <div className={styles['algo-feed__skeleton-avatar']}></div>
            <div className={styles['algo-feed__skeleton-content']}>
              <div className={styles['algo-feed__skeleton-line']}></div>
              <div className={styles['algo-feed__skeleton-line']}></div>
              <div className={styles['algo-feed__skeleton-line-short']}></div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className={styles['algo-feed__error']}>
          <p>{error}</p>
          <p className={styles['algo-feed__error-hint']}>
            Make sure the algo-relay backend is running on port 3334
          </p>
          <button 
            onClick={fetchTrendingNotes}
            className={styles['algo-feed__retry-button']}
          >
            Retry
          </button>
        </div>
      ) : !trendingNotes || trendingNotes.length === 0 ? (
        <div className={styles['algo-feed__empty']}>
          <p>No trending notes found</p>
        </div>
      ) : (
        trendingNotes.map((note) => (
          <div 
            key={note.id} 
            className={styles['algo-feed__note-card']}
            onClick={() => handleNoteClick(note)}
          >
            <div className={styles['algo-feed__note-header']}>
              <img 
                src={getAuthorPicture(note)} 
                alt={getAuthorName(note)}
                className={styles['algo-feed__author-avatar']}
              />
              <div className={styles['algo-feed__author-info']}>
                <span className={styles['algo-feed__author-name']}>
                  {getAuthorName(note)}
                </span>
                <span className={styles['algo-feed__timestamp']}>
                  {formatTimestamp(note.created_at)}
                </span>
              </div>
              {note.score && (
                <div className={styles['algo-feed__score']}>
                  <span className={styles['algo-feed__score-value']}>
                    {note.score.toFixed(1)}
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
        ))
      )}
    </div>
  );

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
          onClick={() => handleAuthorClick(author)}
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

  return (
    <div className={`${styles['algo-feed']} ${className}`}>
      <div className={styles['algo-feed__header']}>
        <div className={styles['algo-feed__header-top']}>
          <h2 className={styles['algo-feed__title']}>Algorithmic Feed</h2>
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
        <div className={styles['algo-feed__tabs']}>
          {showTrending && (
            <button
              className={`${styles['algo-feed__tab']} ${activeTab === 'trending' ? styles['algo-feed__tab--active'] : ''}`}
              onClick={() => setActiveTab('trending')}
            >
              <span className={styles['algo-feed__tab-icon']}>🔥</span>
              Trending
            </button>
          )}
          {showTopAuthors && (
            <button
              className={`${styles['algo-feed__tab']} ${activeTab === 'top-authors' ? styles['algo-feed__tab--active'] : ''}`}
              onClick={() => setActiveTab('top-authors')}
            >
              <span className={styles['algo-feed__tab-icon']}>👥</span>
              Top Authors
            </button>
          )}
        </div>
      </div>

      <div className={styles['algo-feed__content']}>
        {activeTab === 'trending' && renderTrendingNotes()}
        {activeTab === 'top-authors' && renderTopAuthors()}
      </div>
    </div>
  );
};

export default AlgoFeed; 