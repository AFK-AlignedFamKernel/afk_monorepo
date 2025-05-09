'use client';

import { FeedNostr } from '@/components/Nostr/feed';
import React from 'react';
import Link from 'next/link';

// Use inline Layout to avoid type issues
export default function HomePage() {
  return (
    <div className="content">
      <h1 className="text-2xl font-bold mb-4">Welcome to AFK</h1>
      <p className="mb-4">This is the main content of the home page.</p>
      <p className="mb-4">You can add more content here.</p>

      <div className="card">
        <h2 className="text-xl font-semibold">AFK is coming soon</h2>
        <div className="mb-4">
          <FeedNostr />
        </div>
        <div className="mt-6">
          <Link 
            href="/nostr-feed" 
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            View Enhanced Nostr Feed
          </Link>
        </div>
      </div>
    </div>
  );
}
