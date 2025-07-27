'use client';

import React from 'react';
import AlgoFeed from '@/components/Nostr/feed/AlgoFeed';
import AdvancedAlgoFeed from '@/components/Nostr/feed/AdvancedAlgoFeed';
import AlgoFeedHealthCheck from '@/components/Nostr/feed/AlgoFeedHealthCheck';
import WebSocketTest from '@/components/Nostr/feed/WebSocketTest';
import styles from '@/styles/nostr/feed.module.scss';

export default function AlgoFeedDemoPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Algo-Relay Feed Demo</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Health Check Panel */}
        <div className="lg:col-span-2">
          <AlgoFeedHealthCheck />
        </div>

        {/* WebSocket Test Panel */}
        <div className="lg:col-span-2">
          <WebSocketTest />
        </div>

        {/* Simple AlgoFeed */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Simple AlgoFeed (with Refresh)</h2>
          <AlgoFeed 
            limit={10}
            showTrending={true}
            showTopAuthors={true}
            className="mb-4"
          />
        </div>

        {/* Advanced AlgoFeed */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Advanced AlgoFeed (with Refresh & New Trending Authors)</h2>
          <AdvancedAlgoFeed 
            limit={10}
            showTrending={true}
            showViral={true}
            showScraped={true}
            showTopAuthors={true}
            showTrendingTopAuthors={true}
            enableRealTime={false}
            className="mb-4"
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Features Demonstrated:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>✅ Refresh buttons on both feed components</li>
          <li>✅ Data transformation from backend to frontend</li>
          <li>✅ Comprehensive error handling and loading states</li>
          <li>✅ Real-time WebSocket connectivity testing</li>
          <li>✅ Health check for API and WebSocket endpoints</li>
          <li>✅ Multiple data sources (trending, viral, scraped notes)</li>
          <li>✅ Advanced filtering and sorting options</li>
          <li>✅ Responsive design with dark mode support</li>
          <li>✅ <strong>NEW:</strong> Trending Top Authors endpoint with engagement scoring</li>
          <li>✅ <strong>NEW:</strong> Global author ranking based on interactions, zaps, replies</li>
          <li>✅ <strong>NEW:</strong> Time-based filtering (1h, 6h, 24h, 7d, 30d)</li>
          <li>✅ <strong>NEW:</strong> Engagement score calculation with weighted metrics</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-green-800 dark:text-green-200">✅ New Trending Top Authors Endpoint:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-green-700 dark:text-green-300">
          <li><strong>Endpoint:</strong> <code>/api/trending-top-authors</code></li>
          <li><strong>Parameters:</strong> <code>limit</code> (default: 20), <code>time_range</code> (1h, 6h, 24h, 7d, 30d)</li>
          <li><strong>Engagement Score:</strong> (reactions + zaps×2 + replies×1.5) ÷ notes_count</li>
          <li><strong>Metrics:</strong> Total interactions, reactions received, zaps received, replies received, notes count</li>
          <li><strong>Profile Data:</strong> Name and picture from pubkey_settings table</li>
        </ul>
      </div>
    </div>
  );
} 