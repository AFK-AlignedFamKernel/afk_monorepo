'use client';
import React from 'react';
import Link from 'next/link';
import { Icon } from '../small/icon-component';
import { logClickedEvent } from '@/lib/analytics';

export default function MenuHomeComponent() {
  return (
    <div className="shadow-lg p-4 rounded-lg px-4">
      <h2 className="font-semibold">AFK is your gateway for your Freedom</h2>
      <p className="text-sm">
        Own your digital content, data, money and identity.
      </p>
      <p className="text-sm">
        Get rewarded for your digital data on Internet!

      </p>
      {/* <p className="text-sm">
         Cross social media platform all-in-one that allows you to produced and get rewarded for your content.
        </p> */}

      <div className="grid grid-cols-2 gap-4 mt-4 ">
        <Link
          href="/nostr/feed"
          onClick={() => {
            logClickedEvent("go_to_feed", "click", "menu_home")
          }}
        >
          <div className="flex flex-col items-center">
            <Icon name="ConversationIconBubble" size={24} ></Icon>

            <span className="text-white font-semibold text-lg">Feed</span>
          </div>
        </Link>

        <Link
          href="/launchpad"
          onClick={() => {
            logClickedEvent("go_to_launchpad", "click", "menu_home")
          }}
        // className="game-launcher-item bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 p-6 rounded-lg shadow-lg transform hover:scale-105 transition-all"
        >
          <div className="flex flex-col items-center">
            <Icon name="UpwardTrendGraphIcon" size={24}></Icon>
            <span className="text-white font-semibold text-lg">Launchpad</span>
          </div>
        </Link>

        <Link
          href="/discover"
          onClick={() => {
            logClickedEvent("go_to_discover", "click", "menu_home")
          }}
        // className="game-launcher-item bg-gradient-to-br hover:to-blue-800 p-6 rounded-lg shadow-lg transform hover:scale-105 transition-all"
        >
          <div className="flex flex-col items-center">
            <Icon name="DiscoverIcon" size={24} ></Icon>
            <span className="text-white font-semibold text-lg">Discover</span>
          </div>
        </Link>

        <Link
          href="/profile"
          onClick={() => {
            logClickedEvent("go_to_profile", "click", "menu_home")
          }}
        // className="game-launcher-item bg-gradient-to-br hover:to-blue-800 p-6 rounded-lg shadow-lg transform hover:scale-105 transition-all"
        >
          <div className="flex flex-col items-center">
            <Icon name="UserIcon" size={24} ></Icon>

            <span className="text-white font-semibold text-lg">Profile</span>
          </div>
        </Link>
        <Link
          href="/wallet"
          onClick={() => {
            logClickedEvent("go_to_wallet", "click", "menu_home")
          }}
        // className="game-launcher-item  to-purple-700 hover:from-purple-600 hover:to-purple-800 p-6 rounded-lg shadow-lg transform hover:scale-105 transition-all"
        >
          <div className="flex flex-col items-center">
            <Icon name="WalletIcon" size={24}></Icon>
            <span className="text-white font-semibold text-lg">Wallet</span>
          </div>
        </Link>
      </div>

    </div>
  );
}
