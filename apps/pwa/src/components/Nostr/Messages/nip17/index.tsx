'use client';

import React, { useEffect, useState } from 'react';
import { useAuth, useContacts, useNostrContext, useRelayAuthInit } from 'afk_nostr_sdk';
import { useNostrAuth } from '@/hooks/useNostrAuth';
import { FormPrivateMessage } from './FormPrivateMessage';
import { NostrConversationList } from './ConversationList';
import { NostrContactList } from '../NostrContactList';
import { SavedMessages } from './SavedMessages';

export const NostrMessagesComponent: React.FC = () => {
  const [type, setType] = useState<"NIP4" | "NIP17">('NIP17');
  const { publicKey, privateKey } = useAuth();
  const { handleCheckNostrAndSendConnectDialog } = useNostrAuth();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('messages');
  const [isProcessingMessages, setIsProcessingMessages] = useState(false);
  const [messagesData, setMessages] = useState<any>([]);
  const [isBack, setIsBack] = useState(false);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);

  const contacts = useContacts();
  const { ndk } = useNostrContext();
  
  // Use the new relay auth initialization
  const { isAuthenticated, isInitializing, hasError, errorMessage, initializeAuth } = useRelayAuthInit();

  const handleGoBack = () => {
    setSelectedConversation(null);
  };

  const handleConnect = async () => {
    const connected = await handleCheckNostrAndSendConnectDialog();
    if (connected) {
      // refetch();
    }
  };

  const handleNewMessageSent = () => {
    setShowNewMessageForm(false);
    // refetch();
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

  // Show loading state while initializing authentication
  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center p-4 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="text-gray-600">Initializing relay authentication...</p>
      </div>
    );
  }

  // Show error state if authentication failed
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center p-4 space-y-4">
        <h2 className="text-xl font-semibold text-red-600">Authentication Failed</h2>
        <p className="text-gray-600">{errorMessage}</p>
        <button
          onClick={() => initializeAuth()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry Authentication
        </button>
      </div>
    );
  }

  // Show message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center p-4 space-y-4">
        <h2 className="text-xl font-semibold">Authentication Required</h2>
        <p className="text-gray-600">Please authenticate with relays to access messages</p>
        <button
          onClick={() => initializeAuth()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Initialize Authentication
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b overflow-x-auto scrollbar-hide">
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
        <button
          className={`flex-1 py-2 px-4 ${activeTab === 'direct_messages' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('direct_messages')}
        >
          Direct Messages
        </button>
        <button
          className={`flex-1 py-2 px-4 ${activeTab === 'saved_messages' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('saved_messages')}
        >
          Saved Messages
        </button>
      </div>

      {activeTab == "messages" && (
        <>
          <NostrConversationList type={type} setType={setType} />
        </>
      )}

      {activeTab == "contacts" && (
        <NostrContactList />
      )}

      {activeTab == "direct_messages" && (
        <div className="flex">
          <FormPrivateMessage onClose={() => setActiveTab('messages')} type={type} />
        </div>
      )}

      {activeTab == "saved_messages" && (
        <SavedMessages />
      )}

    </div>
  );
};

export default NostrMessagesComponent;
