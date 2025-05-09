'use client';

import React, { useState } from 'react';
import { FeedTabs } from '@/components/Nostr/feed';
import '../../components/Nostr/feed/feed.scss';

export default function NostrFeedPage() {
  const [mobileFiltersVisible, setMobileFiltersVisible] = useState(false);

  const toggleMobileFilters = () => {
    setMobileFiltersVisible(!mobileFiltersVisible);
  };

  return (
    <div className="nostr-feed__container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Nostr Feed
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Explore content from the Nostr network
        </p>
      </header>
      
      <main>
        {/* Mobile filters toggle button */}
    

        <div className="nostr-feed__layout">
          {/* Desktop Sidebar - Filters */}
          {/* <aside className="nostr-feed__sidebar hidden md:flex md:flex-col">
            <div className="nostr-feed__filters">
              <div className="nostr-feed__filters-container">
                <h2 className="nostr-feed__filters-title">
                  Filters
                </h2>
                
                <div className="nostr-feed__filters-group">
                  <div className="nostr-feed__filters-option">
                    <input type="checkbox" id="following" defaultChecked />
                    <label htmlFor="following">Following</label>
                  </div>
                  <div className="nostr-feed__filters-option">
                    <input type="checkbox" id="trending" />
                    <label htmlFor="trending">Trending</label>
                  </div>
                  <div className="nostr-feed__filters-option">
                    <input type="checkbox" id="global" />
                    <label htmlFor="global">Global</label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="nostr-feed__card">
              <h2 className="nostr-feed__filters-title">
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
          </aside> */}
          
          {/* Main Content */}
          <div className="nostr-feed__main">
            <FeedTabs />
          </div>
      
        </div>
      </main>
    </div>
  );
} 