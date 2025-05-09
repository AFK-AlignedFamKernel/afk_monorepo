'use client';

import { FeedNostr } from '@/components/Nostr/feed';
import React from 'react';
import Link from 'next/link';

// Use inline Layout to avoid type issues
export default function HomePage() {
  return (
    <div className="content">
      <h1 className="text-2xl font-bold mb-4">Welcome to AFK</h1>
      <div className="card">
        <h2 className="text-xl font-semibold">AFK is coming soon</h2>
        <p>
          AFK is a gateway for your Freedom.
        </p>
        <p>
          social media platform that allows you to connect with your friends and family.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/nostr-feed"
            className="game-launcher-item bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 p-6 rounded-lg shadow-lg transform hover:scale-105 transition-all"
          >
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white mb-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
              </svg>
              <span className="text-white font-semibold text-lg">Nostr Feed</span>
            </div>
          </Link>

          <Link
            href="/launchpad"
            className="game-launcher-item bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 p-6 rounded-lg shadow-lg transform hover:scale-105 transition-all"
          >
            <div className="flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white mb-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" />
              </svg>
              <span className="text-white font-semibold text-lg">Launchpad</span>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
