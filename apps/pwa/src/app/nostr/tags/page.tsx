'use client';

import React, { useState } from 'react';
import { FeedTabs } from '@/components/Nostr/feed/FeedTabs';
import { useParams } from 'next/navigation';
import NostrTagsFeed from '@/components/Nostr/feed/NostrTagsFeed';

export default function NostrTagsPage() {
  const { tag, type = 'feed', tags } = useParams();
  const [mobileFiltersVisible, setMobileFiltersVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen">
 

      <main className="max-w-7xl py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Search and Filters */}
          {/* <div className="md:w-1/4 space-y-4">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                Search
              </h3>
              <div className="relative">
                <input
                  type="text"
                  className="w-full p-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Search by keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute left-3 top-2.5 text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="hidden md:block bg-white dark:bg-gray-800 shadow rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                Filters
              </h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</h4>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Authors</h4>
                </div>
              </div>
            </div>
          </div> */}

          {/* Main Content */}
          <div
            className="md:w-3/4"
          >
            <NostrTagsFeed searchQuery={searchQuery} tagsProps={tags as string[] || []} selectedTagProps={tag as string} setSelectedTagProps={() => {}} />
          </div>

        </div>
      </main>

      {/* Debug Panel */}
      {/* <DebugPanel isOpen={false} /> */}
    </div>
  );
} 