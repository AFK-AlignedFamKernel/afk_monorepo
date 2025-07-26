'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from 'afk_nostr_sdk';
import { NDKKind } from '@nostr-dev-kit/ndk';
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
import { TAGS_DEFAULT } from 'common';
import { Icon } from '@/components/small/icon-component';
import styles from '@/styles/nostr/algo-feed.module.scss';

interface MainNostrFeedProps {
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
type ContentType = 'posts' | 'articles' | 'shorts' | 'tags';

interface ContentTypeTab {
  id: ContentType;
  label: string;
  kinds: number[];
  icon: React.ReactNode;
}

const MainNostrFeed: React.FC<MainNostrFeedProps> = ({
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
  const [activeContentType, setActiveContentType] = useState<ContentType>('posts');
  const [trendingNotes, setTrendingNotes] = useState<TrendingNote[]>([]);
  const [viralNotes, setViralNotes] = useState<ViralNote[]>([]);
  const [scrapedNotes, setScrapedNotes] = useState<ScrapedNote[]>([]);
  const [topAuthors, setTopAuthors] = useState<TopAuthor[]>([]);
  const [trendingTopAuthors, setTrendingTopAuthors] = useState<TrendingTopAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Tag filtering state
  const [tags, setTags] = useState<string[]>(TAGS_DEFAULT);
  const [selectedTag, setSelectedTag] = useState<string | null>(TAGS_DEFAULT[0]);
  const [tagSearchInput, setTagSearchInput] = useState<string>('');

  // Filter panel state
  const [showFilters, setShowFilters] = useState(false);

  // Content type tabs configuration
  const contentTypeTabs: ContentTypeTab[] = [
    {
      id: 'posts',
      label: 'Posts',
      kinds: [NDKKind.Text, NDKKind.Repost],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      id: 'articles',
      label: 'Articles',
      kinds: [30023],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
          <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
        </svg>
      ),
    },
    {
      id: 'shorts',
      label: 'Shorts',
      kinds: [31000, 31001, 34236, NDKKind.ShortVideo, NDKKind.VerticalVideo, NDKKind.HorizontalVideo, NDKKind.Video],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
        </svg>
      ),
    },
    {
      id: 'tags',
      label: 'Tags',
      kinds: [NDKKind.Text, NDKKind.Article],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
  ];

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

  const handleContentTypeChange = (contentType: ContentType) => {
    setActiveContentType(contentType);
    logClickedEvent('algo_feed_content_type', 'click_content_type', contentType);
    
    // Reset tag selection when switching away from tags
    if (contentType !== 'tags') {
      setSelectedTag(TAGS_DEFAULT[0]);
    }
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTag(tag);
    logClickedEvent(`select_tag_${tag}`, "click", tag);
  };

  const handleTagSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (tagSearchInput.trim()) {
      if (!tags.includes(tagSearchInput.trim())) {
        setTags([tagSearchInput.trim(), ...tags]);
      }
      setSelectedTag(tagSearchInput.trim());
      setTagSearchInput('');
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
    logClickedEvent('algo_feed_toggle_filters', 'click_toggle', showFilters ? 'hide' : 'show');
  };

  // Filter notes by content type
  const filterNotesByContentType = (notes: TrendingNote[] | ViralNote[] | ScrapedNote[]) => {
    if (!notes || notes.length === 0) return [];
    
    if (activeContentType === 'tags') {
      if (!selectedTag) return notes;
      return notes.filter(note => 
        note.tags && note.tags.some(tag => 
          tag && tag.length >= 2 && tag[0] === 't' && tag[1] === selectedTag
        )
      );
    }
    
    const currentTab = contentTypeTabs.find(tab => tab.id === activeContentType);
    if (!currentTab) return notes;
    
    return notes.filter(note => note.kind && currentTab.kinds.includes(note.kind));
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

    // Filter notes based on content type
    const filteredNotes = activeContentType === 'tags' || 
      ['posts', 'articles', 'shorts'].includes(activeContentType) 
        ? filterNotesByContentType(notes as TrendingNote[] | ViralNote[] | ScrapedNote[])
        : notes;

    if (filteredNotes.length === 0) {
      return (
        <div className={styles['algo-feed__empty']}>
          <p>No {activeContentType} found in {activeTab}</p>
        </div>
      );
    }

    return filteredNotes.map((note) => {
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

  const renderFilterPanel = () => (
    <>
      <div className={styles['algo-feed__filter-section']}>
        <h4 className={styles['algo-feed__filter-section-title']}>Content Type</h4>
        <div className={styles['algo-feed__content-type-grid']}>
          {contentTypeTabs.map((tab) => {
            const currentData = getCurrentData() as TrendingNote[] | ViralNote[] | ScrapedNote[];
            const filteredCount = filterNotesByContentType(currentData).length;
            
            return (
              <button
                key={tab.id}
                className={`${styles['algo-feed__content-type-option']} ${
                  activeContentType === tab.id ? styles['algo-feed__content-type-option--active'] : ''
                }`}
                onClick={() => handleContentTypeChange(tab.id)}
                title={`Show ${tab.label.toLowerCase()}`}
              >
                <span className={styles['algo-feed__content-type-icon']}>
                  {tab.icon}
                </span>
                <span className={styles['algo-feed__content-type-label']}>
                  {tab.label}
                </span>
                {filteredCount > 0 && (
                  <span className={styles['algo-feed__content-type-count']}>
                    {filteredCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {activeContentType === 'tags' && (
        <div className={styles['algo-feed__filter-section']}>
          <h4 className={styles['algo-feed__filter-section-title']}>Tags</h4>
          <form
            className={styles['nostr-searchbar']}
            onSubmit={handleTagSearch}
          >
            <input
              type="text"
              className={styles['nostr-searchbar__input']}
              value={tagSearchInput}
              onChange={(e) => setTagSearchInput(e.target.value)}
              placeholder="Search or add tag..."
            />
            <button
              type="submit"
              className={styles['nostr-searchbar__button']}
              disabled={!tagSearchInput || tagSearchInput.trim().length === 0}
            >
              <Icon name="SearchIcon" size={16} />
            </button>
          </form>
          <div className={styles['nostr-tags-row']}>
            {tags.slice(0, 12).map((tag, index) => (
              <div
                key={index}
                className={`${styles['nostr-tag']} ${selectedTag === tag ? styles['selected'] : ''}`}
                onClick={() => handleTagSelect(tag)}
              >
                <span>{tag}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  const getCurrentFilterLabel = () => {
    const currentTab = contentTypeTabs.find(tab => tab.id === activeContentType);
    if (!currentTab) return 'All';
    
    let label = currentTab.label;
    if (activeContentType === 'tags' && selectedTag) {
      label += `: #${selectedTag}`;
    }
    return label;
  };

  return (
    <div className={`${styles['algo-feed']} ${styles['algo-feed--advanced']} ${className}`}>
      <div className={styles['algo-feed__header']}>
        <div className={styles['algo-feed__header-top']}>
          <div className={styles['algo-feed__header-title-section']}>
            <h2 className={styles['algo-feed__title']}>Advanced Algorithmic Feed</h2>
            {activeTab !== 'top-authors' && activeTab !== 'trending-top-authors' && (
              <div className={styles['algo-feed__filter-status']}>
                <span className={styles['algo-feed__filter-indicator']}>
                  {getCurrentFilterLabel()}
                </span>
              </div>
            )}
          </div>
          <div className={styles['algo-feed__header-actions']}>
            {/* <span className={styles['algo-feed__last-update']}>
              Last update: {lastUpdate.toLocaleTimeString()}
            </span> */}
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
            <button
              onClick={toggleFilters}
              className={`${styles['algo-feed__filter-toggle']} ${showFilters ? styles['algo-feed__filter-toggle--active'] : ''}`}
              title={showFilters ? "Hide filters" : "Show filters"}
            >
              <svg 
                className={styles['algo-feed__filter-icon']}
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/>
              </svg>
              {showFilters && (
                <span className={styles['algo-feed__filter-badge']}>
                  {activeContentType !== 'posts' ? '1' : '0'}
                </span>
              )}
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

        {/* Collapsible Filter Panel */}
        {activeTab !== 'top-authors' && activeTab !== 'trending-top-authors' && (
          <div className={`${styles['algo-feed__filter-panel']} ${showFilters ? styles['algo-feed__filter-panel--visible'] : ''}`}>
            {showFilters && renderFilterPanel()}
          </div>
        )}
      </div>

      <div className={styles['algo-feed__content']}>
        {activeTab === 'top-authors' ? renderTopAuthors() : 
         activeTab === 'trending-top-authors' ? renderTrendingTopAuthors() : 
         renderNotes(getCurrentData())}
      </div>
    </div>
  );
};

export default MainNostrFeed; 