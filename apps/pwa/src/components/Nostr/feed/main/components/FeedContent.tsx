import React from 'react';
  import { TabType, ContentType } from '../MainNostrFeed';
import styles from '@/styles/nostr/algo-feed.module.scss';

interface FeedContentProps {
  activeTab: TabType;
  activeContentType: ContentType;
  selectedTag: string | null;
  getCurrentData: () => any[];
  filterNotesByContentType: (notes: any[]) => any[];
  renderNotes: (notes: any[]) => React.ReactNode;
  renderTopAuthors: () => React.ReactNode;
  renderTrendingTopAuthors: () => React.ReactNode;
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onRefreshAtEnd: () => void;
  showRefreshSuccess?: boolean;
  isInfiniteScrollLoading?: boolean;
  loaderRef?: React.RefObject<HTMLDivElement>;
}

export const FeedContent: React.FC<FeedContentProps> = ({
  activeTab,
  activeContentType,
  selectedTag,
  getCurrentData,
  filterNotesByContentType,
  renderNotes,
  renderTopAuthors,
  renderTrendingTopAuthors,
  hasMore,
  loadingMore,
  onLoadMore,
  onRefreshAtEnd,
  showRefreshSuccess,
  isInfiniteScrollLoading,
  loaderRef
}) => (
  <div className={styles['algo-feed__content-scrollable']}>
    {activeTab === 'top-authors' ? renderTopAuthors() : 
     activeTab === 'trending-top-authors' ? renderTrendingTopAuthors() : 
     renderNotes(getCurrentData())}
    
    {/* Refresh success message */}
    {showRefreshSuccess && (
      <div className={styles['algo-feed__refresh-success']}>
        <div className={styles['algo-feed__refresh-success-content']}>
          <svg 
            className={styles['algo-feed__refresh-success-icon']}
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22,4 12,14.01 9,11.01"/>
          </svg>
          <span className={styles['algo-feed__refresh-success-text']}>
            New content found! 🎉
          </span>
        </div>
      </div>
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
    
    {/* End of content indicator */}
    {!hasMore && getCurrentData().length > 0 && (
      <div className={styles['algo-feed__end-of-content']}>
        <p>You've reached the end of the content</p>
        <button
          onClick={onRefreshAtEnd}
          className={styles['algo-feed__refresh-end-button']}
          disabled={loadingMore || isInfiniteScrollLoading}
        >
          {loadingMore || isInfiniteScrollLoading ? 'Checking for new content...' : 'Try Refresh'}
        </button>
      </div>
    )}
  </div>
); 