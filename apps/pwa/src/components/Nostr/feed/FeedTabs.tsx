'use client';

import React, { useState } from 'react';
import { NDKKind } from '@nostr-dev-kit/ndk';
import { NostrEventKind } from '@/types/nostr';
import NostrFeed from './NostrFeed';
import './feed.scss';

interface Tab {
  id: string;
  label: string;
  kinds: NDKKind[];
  icon?: React.ReactNode;
}

interface FeedTabsProps {
  className?: string;
}

export const FeedTabs: React.FC<FeedTabsProps> = ({ className = '' }) => {
  const tabs: Tab[] = [
    {
      id: 'all',
      label: 'All',
      kinds: [
        NDKKind.Text, 
        NostrEventKind.Article as unknown as NDKKind,
        NostrEventKind.ShortForm as unknown as NDKKind,
        NostrEventKind.VerticalVideo as unknown as NDKKind,
        NostrEventKind.HorizontalVideo as unknown as NDKKind
      ],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      id: 'posts',
      label: 'Posts',
      kinds: [NDKKind.Text],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      id: 'articles',
      label: 'Articles',
      kinds: [NostrEventKind.Article as unknown as NDKKind],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
          <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
        </svg>
      ),
    },
    {
      id: 'shorts',
      label: 'Shorts',
      kinds: [
        NostrEventKind.ShortForm as unknown as NDKKind,
        NostrEventKind.VerticalVideo as unknown as NDKKind,
        NostrEventKind.HorizontalVideo as unknown as NDKKind
      ],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
        </svg>
      ),
    },
  ];

  const [activeTab, setActiveTab] = useState<string>(tabs[0].id);
  
  const getActiveTabKinds = (): NDKKind[] => {
    const tab = tabs.find(tab => tab.id === activeTab);
    return tab ? tab.kinds : tabs[0].kinds;
  };

  return (
    <div className={`nostr-feed__container ${className}`}>
      <div className="nostr-feed__tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nostr-feed__tabs-button ${
              activeTab === tab.id ? 'nostr-feed__tabs-button--active' : ''
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="nostr-feed__content">
        <NostrFeed kinds={getActiveTabKinds()} />
      </div>
    </div>
  );
};

export default FeedTabs; 