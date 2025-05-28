'use client';

import React, { useState } from 'react';
import { useAuth } from 'afk_nostr_sdk';
import { useNostrAuth } from '@/hooks/useNostrAuth';
import { NostrConversationList } from './ConversationList';

export const NostrMessagesComponent: React.FC = () => {
  const { publicKey } = useAuth();
  const { handleCheckNostrAndSendConnectDialog } = useNostrAuth();
  const [activeTab, setActiveTab] = useState<string>('messages');
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);

  const handleConnect = () => {
    handleCheckNostrAndSendConnectDialog();
  };

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center p-4 space-y-4">
        <h2 className="text-xl font-semibold">Connect your Nostr account</h2>
        <button
          onClick={handleConnect}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Connect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-2 px-4 ${activeTab === 'messages' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          Messages
        </button>
        <button
          className={`flex-1 py-2 px-4 ${activeTab === 'contacts' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('contacts')}
        >
          Contacts
        </button>
        <button
          className={`flex-1 py-2 px-4 ${activeTab === 'followers' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('followers')}
        >
          Followers
        </button>
      </div>

      {activeTab === "messages" && (
        <NostrConversationList
          type="NIP17"
        />
      )}
    </div>
  );
};

export default NostrMessagesComponent;
