'use client';

import React from 'react';
import NostrFeed from './NostrFeed';

interface FeedNostrProps {
  searchQuery?: string;
  limit?: number;
  kinds?: number[];
}

export const FeedNostr: React.FC<FeedNostrProps> = ({
  searchQuery,
  limit = 10,
  kinds = [1] // Default to regular notes
}) => {
  return (
    <div className="nostr-feed-container">
      <NostrFeed 
        kinds={kinds}
        limit={limit}
        searchQuery={searchQuery}
      />
    </div>
  );
};