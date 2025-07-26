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
import { FeedHeader } from './components/FeedHeader';
import { FeedContent } from './components/FeedContent';
import { FeedTabs } from './components/FeedTabs';
import { useInfiniteScroll } from './hooks/useInfiniteScroll';
import { useAlgoFeedData } from './hooks/useAlgoFeedData';

// Types
export type TabType = 'trending' | 'viral' | 'scraped' | 'top-authors' | 'trending-top-authors';
export type ContentType = 'posts' | 'articles' | 'shorts' | 'tags';

export interface ContentTypeTab {
  id: ContentType;
  label: string;
  kinds: number[];
  icon: React.ReactNode;
}

export interface MainNostrFeedProps {
  className?: string;
  limit?: number;
  showTrending?: boolean;
  showViral?: boolean;
  showScraped?: boolean;
  showTopAuthors?: boolean;
  showTrendingTopAuthors?: boolean;
  enableRealTime?: boolean;
}

// Content Type Tabs Configuration
export const CONTENT_TYPE_TABS: ContentTypeTab[] = [
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




// Main Component
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
  const lastScrollTop = useRef(0);

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
    pushTrendingNotes,
    pushViralNotes,
    pushScrapedNotes,
    pushTopAuthors,
    pushTrendingTopAuthors,
    hasTrendingNote,
    hasViralNote,
    hasScrapedNote,
    hasTopAuthor,
    hasTrendingTopAuthor,
    resetTrendingNotes,
    resetViralNotes,
    resetScrapedNotes,
    resetTopAuthors,
    resetTrendingTopAuthors,
    setOffset,
    resetPagination
  } = useAlgoRelayStore();

  // Custom hooks
  const { getCurrentData, fetchCurrentTabData, resetPagination: resetPaginationData } = useAlgoFeedData(activeTab, limit, publicKey);


  // Initial data load
  useEffect(() => {
    resetPaginationData();
    fetchCurrentTabData(false);
  }, [activeTab, fetchCurrentTabData, resetPaginationData]);

  // Debounce rapid tab changes to prevent excessive API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // This will trigger a re-fetch if needed
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [activeTab]);

  // Real-time updates
  useEffect(() => {
    if (!enableRealTime) return;

    const interval = setInterval(() => {
      // Only fetch if we have existing data to append to
      const currentData = getCurrentData();
      if (currentData.length > 0) {
        console.log(`Real-time update: fetching more data for ${activeTab}`);
        fetchCurrentTabData(true); // Append to existing data
      } else {
        console.log(`Real-time update: initial load for ${activeTab}`);
        fetchCurrentTabData(false); // Initial load
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [enableRealTime, fetchCurrentTabData, activeTab, getCurrentData]);

  // Auto-reload handler
  const handleAutoReload = useCallback(async () => {
    if (isAutoReloading || loading) return;
    
    setIsAutoReloading(true);
    setShowReloadIndicator(true);
    
    try {
      logClickedEvent('algo_feed_auto_reload', 'scroll_to_top', activeTab);
      resetPaginationData();
      await fetchCurrentTabData(false);
    } catch (err) {
      console.error('Auto-reload error:', err);
    } finally {
      setIsAutoReloading(false);
      // Hide indicator after a short delay
      setTimeout(() => setShowReloadIndicator(false), 2000);
    }
  }, [isAutoReloading, loading, activeTab, fetchCurrentTabData, resetPaginationData]);

  // Scroll handler for auto-reload only
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop } = scrollContainerRef.current;
    
    // Auto-reload when scrolling to top (pull-to-refresh behavior)
    if (scrollTop <= 0 && lastScrollTop.current > 0 && !isAutoReloading) {
      handleAutoReload();
    }
    
    // Prevent scroll bouncing on mobile
    if (scrollTop < 0) {
      scrollContainerRef.current.scrollTop = 0;
    }
    
    lastScrollTop.current = scrollTop;
  }, [isAutoReloading, handleAutoReload]);

  // Add scroll event listener for auto-reload only
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleRefresh = async () => {
    logClickedEvent('advanced_algo_feed_refresh', 'click_refresh', activeTab);
    resetPaginationData();
    await fetchCurrentTabData(false);
  };

  const handleLoadMore = useCallback(() => {
    console.log('Manual load more triggered');
    
    // Store current scroll position and find a reference element
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    
    // Find the last visible note to use as a reference point
    const noteElements = scrollContainer.querySelectorAll(`.${styles['algo-feed__note-wrapper']}`);
    const lastVisibleNote = Array.from(noteElements).findLast(el => {
      const rect = el.getBoundingClientRect();
      return rect.bottom <= scrollContainer.getBoundingClientRect().bottom;
    });
    
    // Store the reference element's position
    const referenceElement = lastVisibleNote || noteElements[noteElements.length - 1];
    const referenceRect = referenceElement?.getBoundingClientRect();
    const referenceTop = referenceRect?.top || 0;
    
    console.log('Before load more:', {
      totalNotes: noteElements.length,
      referenceElement: referenceElement?.textContent?.slice(0, 50),
      referenceTop
    });
    
    fetchCurrentTabData(true).then(() => {
      // After new data is loaded, restore position relative to the reference element
      // Use a small delay to ensure DOM has fully updated
      setTimeout(() => {
        requestAnimationFrame(() => {
          if (referenceElement) {
            const newRect = referenceElement.getBoundingClientRect();
            const offset = newRect.top - referenceTop;
            
            console.log('After load more:', {
              newRectTop: newRect.top,
              offset,
              scrollTop: scrollContainer.scrollTop
            });
            
            // Adjust scroll to maintain the reference element's position
            scrollContainer.scrollTop += offset;
          }
        });
      }, 50); // Small delay to ensure DOM updates are complete
    });
  }, [fetchCurrentTabData]);

  // Handle real-time data updates
  const handleRealTimeUpdate = useCallback((newData: any[], dataType: TabType) => {
    console.log(`Real-time update received for ${dataType}:`, newData.length, 'items');
    
    switch (dataType) {
      case 'trending':
        pushTrendingNotes(newData);
        break;
      case 'viral':
        pushViralNotes(newData);
        break;
      case 'scraped':
        pushScrapedNotes(newData);
        break;
      case 'top-authors':
        pushTopAuthors(newData);
        break;
      case 'trending-top-authors':
        pushTrendingTopAuthors(newData);
        break;
    }
  }, [pushTrendingNotes, pushViralNotes, pushScrapedNotes, pushTopAuthors, pushTrendingTopAuthors]);

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
    
    const currentTab = CONTENT_TYPE_TABS.find(tab => tab.id === activeContentType);
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

    return (
      <>
        {filteredNotes.map((note, index) => {
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
        <div 
              key={note.id} // Use note.id instead of combination with index for more stable keys
          className={styles['algo-feed__note-wrapper']}
        >
          <PostEventCard 
            event={ndkEvent}
            profile={ndkEvent.profile}
            className={styles['algo-feed__post-card']}
          />
        </div>
      );
        })}
        
        {/* Load more button for manual loading */}
        {hasMore && filteredNotes.length > 0 && (
          <div className={styles['algo-feed__load-more-container']}>
            <button
              onClick={handleLoadMore}
              className={styles['algo-feed__load-more-button']}
              disabled={loadingMore}
            >
              {loadingMore ? 'Loading...' : 'Load More Content'}
            </button>
          </div>
        )}
      </>
    );
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
    const currentTab = CONTENT_TYPE_TABS.find(tab => tab.id === activeContentType);
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
                  {CONTENT_TYPE_TABS.map((tab) => {
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
      <FeedHeader
        activeTab={activeTab}
        activeContentType={activeContentType}
        selectedTag={selectedTag}
        onRefresh={handleRefresh}
        onOpenFilterModal={openFilterModal}
        getCurrentFilterLabel={getCurrentFilterLabel}
        loading={loading}
      />
      
      <FeedTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        showTrending={showTrending}
        showViral={showViral}
        showScraped={showScraped}
        showTopAuthors={showTopAuthors}
        showTrendingTopAuthors={showTrendingTopAuthors}
        trendingNotes={trendingNotes}
        viralNotes={viralNotes}
        scrapedNotes={scrapedNotes}
        topAuthors={topAuthors}
        trendingTopAuthors={trendingTopAuthors}
      />

      <div 
        ref={scrollContainerRef}
        className={styles['algo-feed__content-container']}
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

        <FeedContent
          activeTab={activeTab}
          activeContentType={activeContentType}
          selectedTag={selectedTag}
          getCurrentData={getCurrentData}
          filterNotesByContentType={filterNotesByContentType}
          renderNotes={renderNotes}
          renderTopAuthors={renderTopAuthors}
          renderTrendingTopAuthors={renderTrendingTopAuthors}
          hasMore={hasMore}
          loadingMore={loadingMore}
          onLoadMore={handleLoadMore}
          // isInfiniteScrollLoading={false}
          // loaderRef={null}
        />
      </div>

      {/* Filter Modal */}
      {renderFilterModal()}
    </div>
  );
};

export default MainNostrFeed; 