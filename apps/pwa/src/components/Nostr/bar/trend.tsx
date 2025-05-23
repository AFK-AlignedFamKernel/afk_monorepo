'use client';

import React from 'react';
import { FeedTabs } from '@/components/Nostr/feed';

export default function TrendComponent() {
  return (
    <div className="container mx-auto px-4 py-8">



      <aside className="md:col-span-3 space-y-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Trending Topics
          </h2>

          <div className="space-y-2">
            <div className="pb-2 border-b border-gray-100 dark:border-gray-700">
              <p className="text-gray-900 dark:text-white font-medium">#nostr</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">1.2k posts</p>
            </div>
            <div className="pb-2 border-b border-gray-100 dark:border-gray-700">
              <p className="text-gray-900 dark:text-white font-medium">#bitcoin</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">845 posts</p>
            </div>
            <div className="pb-2 border-b border-gray-100 dark:border-gray-700">
              <p className="text-gray-900 dark:text-white font-medium">#web3</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">632 posts</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            About
          </h2>

          <p className="text-gray-700 dark:text-gray-300 text-sm">
            This demo showcases different types of Nostr events displayed as cards.
            The components are modular and can be used throughout the application.
          </p>
        </div>
      </aside>
    </div>
  );
} 