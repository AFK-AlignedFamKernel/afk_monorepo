'use client';

import React from 'react';
import { FeedTabs } from '@/components/Nostr/feed';

export default function UsersComponent() {
  return (
    <div className="container mx-auto px-4 py-8">


      <aside className="md:col-span-3 space-y-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Filters
          </h2>

          <div className="space-y-2">
            <div className="flex items-center">
              <input type="checkbox" id="following" className="mr-2" checked />
              <label htmlFor="following" className="text-gray-700 dark:text-gray-300">
                Following
              </label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="trending" className="mr-2" />
              <label htmlFor="trending" className="text-gray-700 dark:text-gray-300">
                Trending
              </label>
            </div>
            <div className="flex items-center">
              <input type="checkbox" id="global" className="mr-2" />
              <label htmlFor="global" className="text-gray-700 dark:text-gray-300">
                Global
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Suggestions
          </h2>

          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full mr-2"></div>
              <div>
                <p className="text-gray-900 dark:text-white font-medium">User 1</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">@user1</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full mr-2"></div>
              <div>
                <p className="text-gray-900 dark:text-white font-medium">User 2</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">@user2</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full mr-2"></div>
              <div>
                <p className="text-gray-900 dark:text-white font-medium">User 3</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">@user3</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

     
    </div>
  );
} 