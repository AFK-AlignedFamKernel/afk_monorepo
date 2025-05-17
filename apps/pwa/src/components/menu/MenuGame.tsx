'use client';
import React from 'react';
import Link from 'next/link';
import { Icon } from '../small/icon-component';

export default function MenuGameComponent() {
  return (
      <div className="shadow-lg p-4 rounded-lg px-4">
        <h2 className="font-semibold">AFK is your gateway for your Freedom</h2>
        <p>
          Own your digital content, data, money and identity.
          Get rewarded for you digital value share on Internet!
        </p>
        {/* <p>
         Cross social media platform all-in-one that allows you to produced and get rewarded for your content.
        </p> */}

        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/nostr/feed"
            className="game-launcher-item bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 p-6 rounded-lg shadow-lg transform hover:scale-105 transition-all"
          >
            <div className="flex flex-col items-center">
              <Icon name="ConversationIconBubble" size={24} ></Icon>
           
              <span className="text-white font-semibold text-lg">Nostr Feed</span>
            </div>
          </Link>

          <Link
            href="/launchpad"
            className="game-launcher-item bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 p-6 rounded-lg shadow-lg transform hover:scale-105 transition-all"
          >
            <div className="flex flex-col items-center">
              <Icon name="HandshakeIcon" size={24}></Icon>
              <span className="text-white font-semibold text-lg">Launchpad</span>
            </div>
          </Link>
        </div>
    </div>
  );
}
