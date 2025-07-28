'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth, useGetAllMessages, useNostrContext, checkIsConnected, useRelayAuthInit, useNip4Subscription } from 'afk_nostr_sdk';
import { useNostrAuth } from '@/hooks/useNostrAuth';
import { useUIStore } from '@/store/uiStore';
import { ChatConversation } from './ChatConversation';
import NDK, { NDKKind } from '@nostr-dev-kit/ndk';
import { nip04 } from 'nostr-tools';

interface NostrConversationListProps {}

export const NostrConversationList: React.FC<NostrConversationListProps> = () => {
  const { publicKey, privateKey, isNostrAuthed } = useAuth();
  const { handleCheckNostrAndSendConnectDialog } = useNostrAuth();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"messages" | "contacts" | "followers" | "direct_messages">('messages');
  const [isProcessingMessages, setIsProcessingMessages] = useState(false);
  const [isBack, setIsBack] = useState(false);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { ndk } = useNostrContext();
  const { showToast } = useUIStore();
  
  // Use the new relay auth initialization
  const { isAuthenticated, isInitializing, hasError, errorMessage, initializeAuth } = useRelayAuthInit();
  
  // Use the new NIP-4 subscription hook
  const {
    messages: subscriptionMessages,
    isLoading: isSubscriptionLoading,
    error: subscriptionError,
    isSubscribed,
    authenticatedRelays,
    refreshMessages,
    cleanupSubscription,
  } = useNip4Subscription({
    enabled: isAuthenticated && !!publicKey && !!privateKey,
    fallbackToUnauthenticated: true, // Enable fallback to unauthenticated relays
    onNewMessage: (event) => {
      console.log('New NIP-4 message received:', event.id);
      showToast({
        message: 'New message received',
        type: 'success',
      });
    },
    onError: (error) => {
      console.error('NIP-4 subscription error:', error);
      showToast({
        message: 'Error receiving messages',
        description: error.message,
        type: 'error',
      });
    },
  });

  // Group messages by conversation (sender-receiver pairs)
  const conversations = useMemo(() => {
    const conversationMap = new Map();
    
    subscriptionMessages.forEach((msg: any) => {
      const otherParty = msg.pubkey === publicKey ? 
        msg.tags?.find((t: any) => t[0] === 'p')?.[1] : 
        msg.pubkey;
      
      if (otherParty && otherParty !== publicKey) {
        const conversationKey = [publicKey, otherParty].sort().join('-');
        
        if (!conversationMap.has(conversationKey)) {
          conversationMap.set(conversationKey, {
            id: conversationKey,
            otherParty,
            lastMessage: msg,
            messageCount: 1,
            lastActivity: msg.created_at,
          });
        } else {
          const conversation = conversationMap.get(conversationKey);
          if (msg.created_at > conversation.lastActivity) {
            conversation.lastMessage = msg;
            conversation.lastActivity = msg.created_at;
          }
          conversation.messageCount++;
        }
      }
    });

    console.log("conversations", conversationMap);
    return Array.from(conversationMap.values())
      .sort((a, b) => b.lastActivity - a.lastActivity);
  }, [subscriptionMessages, publicKey]);

  const fetchAllMessages = async () => {
    // Use the new subscription hook's refresh function
    await refreshMessages();
  };

  // Subscription is now handled by the useNip4Subscription hook

  const handleRefresh = async () => {
    if (isRefreshing) {
      return; // Prevent multiple simultaneous refreshes
    }
    
    setIsRefreshing(true);
    try {
      console.log('Starting NIP-04 messages refresh...');
      await fetchAllMessages();
      showToast({ message: 'Messages refreshed', type: 'success' });
    } catch (error) {
      console.error('Refresh failed:', error);
      showToast({ message: 'Failed to refresh messages', type: 'error' });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Subscription and fetching are now handled by the useNip4Subscription hook

  const handleConversationClick = (conversation: any) => {
    setSelectedConversation({
      senderPublicKey: publicKey,
      receiverPublicKey: conversation.otherParty,
      lastMessage: conversation.lastMessage,
    });
  };

  const handleGoBack = () => {
    setSelectedConversation(null);
  };

  if (selectedConversation) {
    return (
      <ChatConversation
        item={selectedConversation}
        publicKeyProps={publicKey}
        receiverPublicKey={selectedConversation.receiverPublicKey}
        handleGoBack={handleGoBack}
        messagesSentParents={[]}
        type="NIP4"
      />
    );
  }

  // Show loading state while initializing
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

  // Show authentication required state
  if (!isAuthenticated && publicKey && privateKey) {
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

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center p-4 space-y-4">
        <h2 className="text-xl font-semibold">Connect your Nostr account</h2>
        <button
          onClick={() => handleCheckNostrAndSendConnectDialog()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Connect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">NIP-04 Messages</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isSubscriptionLoading}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => setShowNewMessageForm(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            New Message
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isSubscriptionLoading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Loading messages...</p>
          </div>
        ) : conversations?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <p>No conversations yet</p>
            <p className="text-sm">Start a conversation to see messages here</p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations && conversations.length > 0 && conversations?.map((conversation: any) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationClick(conversation)}
                className="p-4 border-b cursor-pointer hover:bg-gray-50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {conversation.otherParty.slice(0, 8)}...{conversation.otherParty.slice(-8)}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage.content}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(conversation.lastActivity * 1000).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 