'use client';

import React from 'react';
import AlgoFeed from '@/components/Nostr/feed/AlgoFeed';
import AdvancedAlgoFeed from '@/components/Nostr/feed/AdvancedAlgoFeed';
import AlgoFeedHealthCheck from '@/components/Nostr/feed/AlgoFeedHealthCheck';
import styles from './page.module.scss';

export default function AlgoFeedDemoPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Algorithmic Feed Demo</h1>
        <p>Showcasing the new algorithmic feed components powered by the algo-relay backend</p>
        <AlgoFeedHealthCheck />
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2>Basic Algorithmic Feed</h2>
          <p>A simple feed showing trending notes and top authors</p>
          <div className={styles.feedContainer}>
            <AlgoFeed 
              limit={10}
              showTrending={true}
              showTopAuthors={true}
            />
          </div>
        </section>

        <section className={styles.section}>
          <h2>Advanced Algorithmic Feed</h2>
          <p>Full-featured feed with multiple tabs, filters, and real-time updates</p>
          <div className={styles.feedContainer}>
            <AdvancedAlgoFeed 
              limit={15}
              showTrending={true}
              showViral={true}
              showScraped={true}
              showTopAuthors={true}
              enableRealTime={true}
            />
          </div>
        </section>

        <section className={styles.section}>
          <h2>Trending Only Feed</h2>
          <p>Feed focused only on trending content</p>
          <div className={styles.feedContainer}>
            <AlgoFeed 
              limit={8}
              showTrending={true}
              showTopAuthors={false}
            />
          </div>
        </section>

        <section className={styles.section}>
          <h2>Viral Content Feed</h2>
          <p>Feed showing viral content with advanced filtering</p>
          <div className={styles.feedContainer}>
            <AdvancedAlgoFeed 
              limit={12}
              showTrending={false}
              showViral={true}
              showScraped={false}
              showTopAuthors={false}
              enableRealTime={false}
            />
          </div>
        </section>

        <section className={styles.section}>
          <h2>Top Authors Feed</h2>
          <p>Feed showing top authors for the current user</p>
          <div className={styles.feedContainer}>
            <AlgoFeed 
              limit={20}
              showTrending={false}
              showTopAuthors={true}
            />
          </div>
        </section>
      </div>

      <div className={styles.info}>
        <h3>Features</h3>
        <ul>
          <li>🔥 <strong>Trending Notes:</strong> Algorithmically ranked content based on engagement</li>
          <li>🚀 <strong>Viral Content:</strong> Content that's going viral across the network</li>
          <li>📊 <strong>Scraped Notes:</strong> Comprehensive data from the algo-relay scraper</li>
          <li>👥 <strong>Top Authors:</strong> Authors you interact with most</li>
          <li>⚡ <strong>Real-time Updates:</strong> Live updates via WebSocket</li>
          <li>🔍 <strong>Advanced Filtering:</strong> Filter by time, content type, and sort options</li>
          <li>📱 <strong>Mobile Responsive:</strong> Optimized for all screen sizes</li>
          <li>🌙 <strong>Dark Mode Support:</strong> Automatic theme switching</li>
        </ul>

        <h3>Backend Integration</h3>
        <p>
          These components integrate with the algo-relay backend which provides:
        </p>
        <ul>
          <li>Real-time Nostr event processing</li>
          <li>Algorithmic scoring and ranking</li>
          <li>User interaction tracking</li>
          <li>Content scraping and analysis</li>
          <li>WebSocket real-time updates</li>
        </ul>
      </div>
    </div>
  );
} 