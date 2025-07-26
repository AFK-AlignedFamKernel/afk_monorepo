import React from 'react';
import { TabType } from '../MainNostrFeed';
import { TrendingNote, ViralNote, ScrapedNote, TopAuthor, TrendingTopAuthor } from '@/services/algoRelayService';
import styles from '@/styles/nostr/algo-feed.module.scss';

interface FeedTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  showTrending: boolean;
  showViral: boolean;
  showScraped: boolean;
  showTopAuthors: boolean;
  showTrendingTopAuthors: boolean;
  trendingNotes: TrendingNote[];
  viralNotes: ViralNote[];
  scrapedNotes: ScrapedNote[];
  topAuthors: TopAuthor[];
  trendingTopAuthors: TrendingTopAuthor[];
}

export const FeedTabs: React.FC<FeedTabsProps> = ({
  activeTab,
  onTabChange,
  showTrending,
  showViral,
  showScraped,
  showTopAuthors,
  showTrendingTopAuthors,
  trendingNotes,
  viralNotes,
  scrapedNotes,
  topAuthors,
  trendingTopAuthors
}) => (
  <div className={styles['algo-feed__tabs']}>
    {showTrending && (
      <button
        className={`${styles['algo-feed__tab']} ${activeTab === 'trending' ? styles['algo-feed__tab--active'] : ''}`}
        onClick={() => onTabChange('trending')}
      >
        <span className={styles['algo-feed__tab-icon']}>🔥</span>
        Trending ({trendingNotes.length})
      </button>
    )}
    {showViral && (
      <button
        className={`${styles['algo-feed__tab']} ${activeTab === 'viral' ? styles['algo-feed__tab--active'] : ''}`}
        onClick={() => onTabChange('viral')}
      >
        <span className={styles['algo-feed__tab-icon']}>🚀</span>
        Viral ({viralNotes.length})
      </button>
    )}
    {showScraped && (
      <button
        className={`${styles['algo-feed__tab']} ${activeTab === 'scraped' ? styles['algo-feed__tab--active'] : ''}`}
        onClick={() => onTabChange('scraped')}
      >
        <span className={styles['algo-feed__tab-icon']}>📊</span>
        Scraped ({scrapedNotes.length})
      </button>
    )}
    {showTopAuthors && (
      <button
        className={`${styles['algo-feed__tab']} ${activeTab === 'top-authors' ? styles['algo-feed__tab--active'] : ''}`}
        onClick={() => onTabChange('top-authors')}
      >
        <span className={styles['algo-feed__tab-icon']}>👥</span>
        My Authors ({topAuthors.length})
      </button>
    )}
    {showTrendingTopAuthors && (
      <button
        className={`${styles['algo-feed__tab']} ${activeTab === 'trending-top-authors' ? styles['algo-feed__tab--active'] : ''}`}
        onClick={() => onTabChange('trending-top-authors')}
      >
        <span className={styles['algo-feed__tab-icon']}>⭐</span>
        Trending Authors ({trendingTopAuthors.length})
      </button>
    )}
  </div>
); 