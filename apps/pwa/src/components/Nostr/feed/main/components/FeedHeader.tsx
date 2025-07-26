import React from 'react';
import { TabType, ContentType } from '../MainNostrFeed';
import styles from '@/styles/nostr/algo-feed.module.scss';

interface FeedHeaderProps {
  activeTab: TabType;
  activeContentType: ContentType;
  selectedTag: string | null;
  onRefresh: () => void;
  onOpenFilterModal: () => void;
  getCurrentFilterLabel: () => string;
  loading: boolean;
}

export const FeedHeader: React.FC<FeedHeaderProps> = ({ 
  activeTab, 
  activeContentType, 
  selectedTag, 
  onRefresh, 
  onOpenFilterModal, 
  getCurrentFilterLabel, 
  loading 
}) => (
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
          onClick={onRefresh}
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
          onClick={onOpenFilterModal}
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
  </div>
); 