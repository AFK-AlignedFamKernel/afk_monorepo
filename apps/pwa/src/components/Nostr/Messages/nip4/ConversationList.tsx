'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth, useGetAllMessages, useNostrContext, checkIsConnected, useRelayAuthInit } from 'afk_nostr_sdk';
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
  const [messagesData, setMessages] = useState<any>([]);
  const [isBack, setIsBack] = useState(false);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const { ndk } = useNostrContext();
  const { showToast } = useUIStore();
  
  // Use the new relay auth initialization
  const { isAuthenticated, isInitializing, hasError, errorMessage, initializeAuth } = useRelayAuthInit();

  // Group messages by conversation (sender-receiver pairs)
  const conversations = useMemo(() => {
    const conversationMap = new Map();
    
    messagesData.forEach((msg: any) => {
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

    return Array.from(conversationMap.values())
      .sort((a, b) => b.lastActivity - a.lastActivity);
  }, [messagesData, publicKey]);

  const fetchAllMessages = async () => {
    if (!publicKey || !privateKey) {
      return;
    }
    
    try {
      setIsLoadingMessages(true);
      await checkIsConnected(ndk);
      
      // Test relay connection first
      const connectedRelays = ndk.pool.connectedRelays();
      console.log('Connected relays:', connectedRelays.map(r => r.url));
      
      if (connectedRelays.length === 0) {
        console.warn('No relays connected, trying to connect...');
        await ndk.connect();
        const newConnectedRelays = ndk.pool.connectedRelays();
        console.log('After connect - Connected relays:', newConnectedRelays.map(r => r.url));
      }
      
      console.log('Fetching NIP-04 messages...');
      // Fetch both sent and received messages with timeout
      const fetchPromise = Promise.race([
        ndk.fetchEvents([
          {
            kinds: [4],
            authors: [publicKey],
            limit: 50,
          },
          {
            kinds: [4],
            '#p': [publicKey],
            limit: 50,
          }
        ]),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Fetch timeout')), 15000)
        )
      ]);

      console.log('Fetch promise:', fetchPromise);

      const events = await fetchPromise;

      console.log('Fetched NIP-04 messages:', events);

      // Check if events is valid and convert to array
      if (!events || typeof events !== 'object') {
        console.warn('No events received or invalid events object');
        setMessages([]);
        return;
      }

      // Convert events to array if it's not already
      const eventsArray = Array.isArray(events) ? events : Array.from(events as any);
      console.log('Events array length:', eventsArray.length);

      // Decrypt messages
      const decryptedEvents = await Promise.all(
        eventsArray.map(async (event: any) => {
          let decryptedContent = '';
          try {
            let peerPubkey = event.pubkey === publicKey ? 
              event.tags?.find((t: any) => t[0] === 'p')?.[1] : 
              event.pubkey;
            
            if (peerPubkey) {
              decryptedContent = await nip04.decrypt(privateKey, peerPubkey, event.content);
            }
          } catch (e) {
            console.warn('Failed to decrypt message:', e);
            decryptedContent = '[Unable to decrypt]';
          }
          return { 
            ...event, 
            senderPublicKey: event.pubkey, 
            decryptedContent,
            receiverPublicKey: event.pubkey === publicKey ? 
              event.tags?.find((t: any) => t[0] === 'p')?.[1] : 
              event.pubkey,
          };
        })
      );

      setMessages(decryptedEvents);
      console.log('Fetched and decrypted', decryptedEvents.length, 'NIP-04 messages');
    } catch (error) {
      console.error('Error fetching NIP-04 messages:', error);
      // Don't throw error, just log it and continue
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const setupMessageSubscription = async () => {
    if (!publicKey || !privateKey) {
      return;
    }
    
    try {
      await checkIsConnected(ndk);
      
      console.log('Setting up NIP-04 subscription for:', publicKey);
      
      // Add timeout to prevent infinite subscription
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Subscription timeout')), 5000); // 5 second timeout
      });
      
      // Create filters with proper validation
      const filters = [
        {
          kinds: [4],
          authors: [publicKey],
          limit: 10,
        },
        {
          kinds: [4],
          '#p': [publicKey],
          limit: 10,
        }
      ];
      
      console.log('Subscription filters:', filters);
      
      const subscriptionPromise = ndk.subscribe(filters);

      const subscription = await Promise.race([subscriptionPromise, timeoutPromise]) as any;

      const handleEvent = async (event: any) => {
        try {
          console.log('Received NIP-04 event:', event.id);
          let decryptedContent = '';
          let peerPubkey = event.pubkey === publicKey ? 
            event.tags?.find((t: any) => t[0] === 'p')?.[1] : 
            event.pubkey;
          
          if (peerPubkey) {
            decryptedContent = await nip04.decrypt(privateKey, peerPubkey, event.content);
          }

          setMessages((prev: any) => {
            // Avoid duplicates
            if (prev.some((m: any) => m.id === event.id)) return prev;
            return [...prev, { 
              ...event, 
              senderPublicKey: event.pubkey, 
              decryptedContent,
              receiverPublicKey: event.pubkey === publicKey ? 
                event.tags?.find((t: any) => t[0] === 'p')?.[1] : 
                event.pubkey,
            }];
          });
        } catch (error) {
          console.warn('Error handling subscription event:', error);
        }
      };

      subscription.on("event", handleEvent);
      subscription.on("event:dup", handleEvent);
      
      console.log('NIP-04 subscription set up successfully');
      
      // Store subscription for cleanup
      setSubscription(subscription);
      return subscription;
    } catch (error) {
      console.error("Error setting up subscription:", error);
      return null;
    }
  };

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscription) {
        try {
          subscription.stop();
        } catch (error) {
          console.warn('Error stopping subscription:', error);
        }
      }
    };
  }, [subscription]);

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

  useEffect(() => {
    if (isAuthenticated && publicKey && privateKey) {
      console.log('Initial NIP-04 messages fetch...');
      fetchAllMessages().catch(error => {
        console.error('Initial fetch failed:', error);
        // Don't show toast for initial fetch failures
      });
      setupMessageSubscription();
    } else if (!isAuthenticated && publicKey && privateKey) {
      console.log('NIP-04: Not authenticated, skipping message fetch');
    }
  }, [publicKey, privateKey, isAuthenticated]); // Remove fetchAllMessages from dependencies

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
            disabled={isRefreshing || isLoadingMessages}
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
        {isLoadingMessages ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-gray-600">Loading messages...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <p>No conversations yet</p>
            <p className="text-sm">Start a conversation to see messages here</p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation: any) => (
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