'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from 'afk_nostr_sdk';
import { NDKKind } from '@nostr-dev-kit/ndk';
import { logClickedEvent } from '@/lib/analytics';
import { 
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
import { useAlgoRelayStore } from '@/stores/algoRelayStore';
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
  
  // Tag filtering state
  const [tags, setTags] = useState<string[]>(TAGS_DEFAULT);
  const [selectedTag, setSelectedTag] = useState<string | null>(TAGS_DEFAULT[0]);
  const [tagSearchInput, setTagSearchInput] = useState<string>('');

  // Filter modal state
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Scroll container ref for infinite scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-reload state
  const [isAutoReloading, setIsAutoReloading] = useState(false);
  const [showReloadIndicator, setShowReloadIndicator] = useState(false);
  const [isInfiniteScrollLoading, setIsInfiniteScrollLoading] = useState(false);
  const lastScrollTop = useRef(0);
  
  // Intersection observer for infinite scroll
  const loadingTriggerRef = useRef<HTMLDivElement>(null);

  // Store state
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

  const fetchCurrentTabData = useCallback(async (append = false) => {
    try {
      switch (activeTab) {
        case 'trending':
          await fetchTrendingNotes(limit, 0, append);
          break;
        case 'viral':
          await fetchViralNotes(limit, 0, append);
          break;
        case 'scraped':
          await fetchScrapedNotes(limit, 0, append);
          break;
        case 'top-authors':
          if (publicKey) {
            await fetchTopAuthors(publicKey, limit, 0, append);
          }
          break;
        case 'trending-top-authors':
          await fetchTrendingTopAuthors(limit, 0, append);
          break;
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, [activeTab, limit, publicKey, fetchTrendingNotes, fetchViralNotes, fetchScrapedNotes, fetchTopAuthors, fetchTrendingTopAuthors]);

  // Initial data load
  useEffect(() => {
    resetPagination();
    fetchCurrentTabData(false);
  }, [activeTab, fetchCurrentTabData, resetPagination]);

  // Real-time updates
  useEffect(() => {
    if (!enableRealTime) return;

    const interval = setInterval(() => {
      fetchCurrentTabData(false);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [enableRealTime, fetchCurrentTabData]);

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

  // Auto-reload handler
  const handleAutoReload = useCallback(async () => {
    if (isAutoReloading || loading) return;
    
    setIsAutoReloading(true);
    setShowReloadIndicator(true);
    
    try {
      logClickedEvent('algo_feed_auto_reload', 'scroll_to_top', activeTab);
      resetPagination();
      await fetchCurrentTabData(false);
    } catch (err) {
      console.error('Auto-reload error:', err);
    } finally {
      setIsAutoReloading(false);
      // Hide indicator after a short delay
      setTimeout(() => setShowReloadIndicator(false), 2000);
    }
  }, [isAutoReloading, loading, activeTab, fetchCurrentTabData, resetPagination]);

  // Scroll handler for auto-reload and infinite scroll
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    
    // Auto-reload when scrolling to top (pull-to-refresh behavior)
    if (scrollTop <= 0 && lastScrollTop.current > 0 && !isAutoReloading) {
      handleAutoReload();
    }
    
    // Infinite scroll when scrolling to bottom (fallback to intersection observer)
    if (!loadingMore && !isInfiniteScrollLoading && hasMore) {
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      if (scrollPercentage > 0.95) { // Trigger when 95% scrolled
        console.log('Scroll-based infinite scroll triggered at', Math.round(scrollPercentage * 100) + '%');
        setIsInfiniteScrollLoading(true);
        const currentDataLength = getCurrentData().length;
        setOffset(currentDataLength);
        fetchCurrentTabData(true).finally(() => {
          setIsInfiniteScrollLoading(false);
        });
      } else if (scrollPercentage > 0.8) {
        // Debug log when approaching trigger point
        console.log('Approaching infinite scroll trigger:', Math.round(scrollPercentage * 100) + '%');
      }
    }
    
    lastScrollTop.current = scrollTop;
  }, [isAutoReloading, handleAutoReload, loadingMore, isInfiniteScrollLoading, hasMore, fetchCurrentTabData, setOffset, getCurrentData]);

  // Add scroll event listener
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!loadingTriggerRef.current || !hasMore || loadingMore || isInfiniteScrollLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !loadingMore && !isInfiniteScrollLoading && hasMore) {
            console.log('Intersection observer triggered - loading more content');
            setIsInfiniteScrollLoading(true);
            // Load more content when the trigger element becomes visible
            const currentDataLength = getCurrentData().length;
            setOffset(currentDataLength);
            fetchCurrentTabData(true).finally(() => {
              setIsInfiniteScrollLoading(false);
            });
          }
        });
      },
      {
        root: scrollContainerRef.current,
        rootMargin: '100px', // Start loading when trigger is 100px away from viewport
        threshold: 0.1 // More reliable threshold
      }
    );

    observer.observe(loadingTriggerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingMore, isInfiniteScrollLoading, fetchCurrentTabData, setOffset, getCurrentData]);

  const handleRefresh = async () => {
    logClickedEvent('advanced_algo_feed_refresh', 'click_refresh', activeTab);
    resetPagination();
    await fetchCurrentTabData(false);
  };

  const handleLoadMore = () => {
    console.log('Manual load more triggered');
    setIsInfiniteScrollLoading(true);
    const currentDataLength = getCurrentData().length;
    setOffset(currentDataLength);
    fetchCurrentTabData(true).finally(() => {
      setIsInfiniteScrollLoading(false);
    });
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

  const openFilterModal = () => {
    setShowFilterModal(true);
    logClickedEvent('algo_feed_open_filter_modal', 'click_open', 'filter_modal');
  };

  const closeFilterModal = () => {
    setShowFilterModal(false);
    logClickedEvent('algo_feed_close_filter_modal', 'click_close', 'filter_modal');
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
    if (loading && notes.length === 0) {
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

    if (error && notes.length === 0) {
      return (
        <div className={styles['algo-feed__error']}>
          <p>{error}</p>
          <button 
            onClick={() => fetchCurrentTabData(false)}
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

  const getCurrentFilterLabel = () => {
    const currentTab = contentTypeTabs.find(tab => tab.id === activeContentType);
    if (!currentTab) return 'All';
    
    let label = currentTab.label;
    if (activeContentType === 'tags' && selectedTag) {
      label += `: #${selectedTag}`;
    }
    return label;
  };

  const renderFilterModal = () => (
    <>
      {showFilterModal && (
        <div className={styles['algo-feed__modal-overlay']} onClick={closeFilterModal}>
          <div className={styles['algo-feed__modal']} onClick={(e) => e.stopPropagation()}>
            <div className={styles['algo-feed__modal-header']}>
              <h3 className={styles['algo-feed__modal-title']}>Filter Content</h3>
              <button 
                onClick={closeFilterModal}
                className={styles['algo-feed__modal-close']}
                title="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className={styles['algo-feed__modal-content']}>
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
            </div>

            <div className={styles['algo-feed__modal-footer']}>
              <button 
                onClick={closeFilterModal}
                className={styles['algo-feed__modal-button']}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

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
              onClick={openFilterModal}
              className={styles['algo-feed__filter-toggle']}
              title="Open filters"
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
              {activeContentType !== 'posts' && (
                <span className={styles['algo-feed__filter-badge']}>
                  1
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
      </div>

      <div 
        ref={scrollContainerRef}
        className={styles['algo-feed__content-scrollable']}
      >
        {/* Auto-reload indicator */}
        {showReloadIndicator && (
          <div className={styles['algo-feed__auto-reload-indicator']}>
            <div className={styles['algo-feed__auto-reload-content']}>
              <svg 
                className={`${styles['algo-feed__auto-reload-icon']} ${isAutoReloading ? styles['algo-feed__auto-reload-icon--spinning'] : ''}`}
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
              <span className={styles['algo-feed__auto-reload-text']}>
                {isAutoReloading ? 'Refreshing...' : 'Refreshed!'}
              </span>
            </div>
          </div>
        )}

        {activeTab === 'top-authors' ? renderTopAuthors() : 
         activeTab === 'trending-top-authors' ? renderTrendingTopAuthors() : 
         renderNotes(getCurrentData())}
        
        {/* Loading trigger for infinite scroll */}
        {hasMore && (
          <div 
            ref={loadingTriggerRef}
            className={styles['algo-feed__loading-trigger']}
            style={{ 
              height: '20px', 
              opacity: 0.3, 
              background: 'var(--primary-color)', 
              borderRadius: '4px',
              margin: '1rem 0'
            }}
            title="Infinite scroll trigger - scroll to this point to load more"
          />
        )}
        
        {/* Loading more indicator */}
        {(loadingMore || isInfiniteScrollLoading) && (
          <div className={styles['algo-feed__loading-more']}>
            <div className={styles['algo-feed__loading-spinner']}>
              <svg 
                className={styles['algo-feed__spinner-icon']}
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
              <span className={styles['algo-feed__loading-text']}>
                Loading more content...
              </span>
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
        )}
        
        {/* Manual Load More button (fallback) */}
        {hasMore && !loadingMore && !isInfiniteScrollLoading && getCurrentData().length > 0 && (
          <div className={styles['algo-feed__load-more-container']}>
            <button
              onClick={handleLoadMore}
              className={styles['algo-feed__load-more-button']}
            >
              Load More Content
            </button>
          </div>
        )}
        
        {/* End of content indicator */}
        {!hasMore && getCurrentData().length > 0 && (
          <div className={styles['algo-feed__end-of-content']}>
            <p>You've reached the end of the content</p>
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {renderFilterModal()}
    </div>
  );
};

export default MainNostrFeed; 