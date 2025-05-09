'use client';

import { FeedNostr } from '@/components/Nostr/feed/feed';
import React from 'react';

// Use inline Layout to avoid type issues
export default function NostrPage() {
  return (
    <div className="content">
      <h1 className="text-2xl font-bold mb-4">Welcome to AFK</h1>
      <p className="mb-4">This is the main content of the home page.</p>
      <p className="mb-4">You can add more content here.</p>

      <div className="card">
        <h2 className="text-xl font-semibold">AFK is coming soon</h2>
        <FeedNostr />
        {/* <p className="mb-2">AFK is a decentralized social network that allows you to connect with your friends and family.</p> */}
        {/* <a 
          href="/layout" 
          className="sidebar-nav-item"
        >
          View Demo
        </a> */}
      </div>
    </div>
  );
}
