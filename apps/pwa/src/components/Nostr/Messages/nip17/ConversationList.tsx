'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { checkIsConnected, deriveSharedKey, useAuth, useContacts, useGetAllMessages, useIncomingMessageUsers, useMyGiftWrapMessages, useMyMessagesSent, useNostrContext, useRoomMessages, useSendPrivateMessage, v2, useRelayAuthInit, useNip4Subscription } from 'afk_nostr_sdk';
import { useNostrAuth } from '@/hooks/useNostrAuth';
import { FormPrivateMessage } from './FormPrivateMessage';
import NDK, { NDKEvent, NDKKind, NDKPrivateKeySigner, NDKUser } from '@nostr-dev-kit/ndk';
import { ChatConversation } from './ChatConversation';
import { useUIStore } from '@/store/uiStore';
import CryptoLoading from '@/components/small/crypto-loading';
import { logClickedEvent } from '@/lib/analytics';
import { Icon } from '@/components/small/icon-component';

interface NostrConversationListProps {
  type: "NIP4" | "NIP17";
  setType?: (type: "NIP4" | "NIP17") => void;
}

export const NostrConversationList: React.FC<NostrConversationListProps> = ({ type, setType }) => {
  const { publicKey, privateKey, isNostrAuthed } = useAuth();
  const { handleCheckNostrAndSendConnectDialog } = useNostrAuth();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"messages" | "contacts" | "followers" | "direct_messages">('messages');
  const [isProcessingMessages, setIsProcessingMessages] = useState(false);
  const [messagesData, setMessages] = useState<any>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use the new relay auth initialization
  const { isAuthenticated, isInitializing, hasError, errorMessage, initializeAuth } = useRelayAuthInit();
  
  const messagesMemo = useMemo(() => {
    const unique = new Map();
    messagesData.forEach((msg: any) => {
      let tagReceiver = msg.tags?.find((t: any) => t[0] === 'p' && t[1] === publicKey);
      if (
        msg.type === "NIP4" &&
        (tagReceiver || msg.pubkey === publicKey)
      ) {
        unique.set(msg.id, msg);
      }
    });
    return Array.from(unique.values()).sort((a, b) => a.created_at - b.created_at);
  }, [messagesData, publicKey]);

  const [isBack, setIsBack] = useState(false);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);

  const { data: incomingMessages, isPending, refetch } = useIncomingMessageUsers({
    limit: 100,
  });
  
  const contacts = useContacts();
  const [message, setMessage] = useState<string | null>(null);

  const { ndk } = useNostrContext();
  const [ndkSigner, setNdkSigner] = useState<NDKPrivateKeySigner | null>(null);
  const [ndkUser, setNdkUser] = useState<NDKUser | null>(null);
  const { mutateAsync: sendMessage } = useSendPrivateMessage();
  const roomIds = selectedConversation
    ? [selectedConversation?.senderPublicKey, selectedConversation?.receiverPublicKey]
    : [];

  const { showToast } = useUIStore();

  // Use NIP4 subscription hook for real-time messages
  const {
    messages: nip4Messages,
    isLoading: isLoadingNip4,
    error: nip4Error,
    isSubscribed: isNip4Subscribed,
    refreshMessages: refreshNip4Messages,
    initialize: initializeNip4,
    reset: resetNip4,
  } = useNip4Subscription({
    enabled: type === "NIP4" && !!publicKey && !!privateKey,
    fallbackToUnauthenticated: true, // Enable fallback to unauthenticated relays
    onNewMessage: (event) => {
      console.log('New NIP4 message received:', event);
      // Add to messages data
      setMessages((prev: any) => [...prev, { ...event, senderPublicKey: event.pubkey, type: "NIP4" }]);
    },
    onError: (error) => {
      console.error('NIP4 subscription error:', error);
      showToast({ message: 'Error loading messages', type: 'error' });
    },
  });

  // Initialize NIP4 subscription when component mounts or type changes
  useEffect(() => {
    if (type === "NIP4" && publicKey && privateKey) {
      initializeNip4();
    } else if (type !== "NIP4") {
      resetNip4();
    }
  }, [type, publicKey, privateKey, initializeNip4, resetNip4]);

  // Update messages data when NIP4 messages change
  useEffect(() => {
    if (type === "NIP4" && nip4Messages) {
      const processedMessages = nip4Messages.map((event: any) => ({
        ...event,
        senderPublicKey: event.pubkey,
        type: "NIP4"
      }));
      setMessages(processedMessages);
    }
  }, [nip4Messages, type]);

  // Handle refresh for both NIP4 and NIP17
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (type === "NIP4") {
        await refreshNip4Messages();
        showToast({ message: 'Messages refreshed', type: 'success' });
      } else {
        // For NIP17, refetch the queries
        await refetch();
        showToast({ message: 'Messages refreshed', type: 'success' });
      }
    } catch (error) {
      console.error('Error refreshing messages:', error);
      showToast({ message: 'Error refreshing messages', type: 'error' });
    } finally {
      setIsRefreshing(false);
    }
  }, [type, refreshNip4Messages, refetch, showToast]);

  const fetchMessagesSent = async (ndk: NDK, publicKey: string, limit: number): Promise<NDKEvent[]> => {
    try {
      await checkIsConnected(ndk);
      console.log("fetchMessagesSent");

      // Add timeout to fetchEvents
      const directMessagesSent = await Promise.race([
        ndk.fetchEvents({
          kinds: [4 as NDKKind],
          authors: [publicKey],
          limit: limit || 10,
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Fetch timeout')), 15000)
        )
      ]);
      
      console.log("directMessagesSent", directMessagesSent);
      return Array.from(directMessagesSent);
    } catch (error) {
      console.log("error fetchMessagesSent", error);
      return [];
    }
  };

  const fetchMessagesReceived = async (ndk: NDK, publicKey: string, limit: number): Promise<NDKEvent[]> => {
    try {
      console.log("fetchMessagesReceived");
      await checkIsConnected(ndk);
      
      // Add timeout to fetchEvents
      const directMessagesReceived = await Promise.race([
        ndk.fetchEvents({
          kinds: [4],
          '#p': [publicKey],
          limit: limit || 30,
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Fetch timeout')), 15000)
        )
      ]);

      console.log("directMessagesReceived", directMessagesReceived);
      return Array.from(directMessagesReceived);
    } catch (error) {
      console.log("error fetchMessagesReceived", error);
      return [];
    }
  };

  const handleAllMessages = async () => {
    if (type === "NIP4") {
      // For NIP4, use the subscription system
      await handleRefresh();
      return;
    }

    // Legacy NIP17 handling
    try {
      setIsLoadingMessages(true);
      console.log("publicKey", publicKey);
      
      const fetchWithRetry = async (fetchFn: () => Promise<NDKEvent[]>, maxRetries = 3): Promise<NDKEvent[]> => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            return await fetchFn();
          } catch (error) {
            console.log(`Attempt ${i + 1} failed:`, error);
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
          }
        }
        return [];
      };

      const [messages, messagesReceived] = await Promise.all([
        fetchWithRetry(() => fetchMessagesSent(ndk, publicKey, 10)),
        fetchWithRetry(() => fetchMessagesReceived(ndk, publicKey, 10))
      ]);

      console.log("messages Sent", messages);
      console.log("messagesReceived", messagesReceived);
      
      const allMessages = [...messages, ...messagesReceived];

      let uniqueDm: any[] = [];

      const uniqueConversations = allMessages.reduce((acc: any, message: any) => {
        const key = `${message.pubkey}`;
        if (!acc[key]) {
          acc[key] = message;
        }
        uniqueDm.push(message);
        return acc;
      }, {});

      console.log('allMessages', allMessages);

      const seenPubkeys = new Set();
      uniqueDm = uniqueDm.filter((item: any) => {
        if (!item?.pubkey) return false;
        if (seenPubkeys.has(item.pubkey)) {
          return false;
        }
        seenPubkeys.add(item.pubkey);
        return true;
      });

      console.log("uniqueDm", uniqueDm);
      const uniqueConversationsArray = Array.from(new Set(uniqueDm));
      console.log("uniqueConversationsArray", uniqueConversationsArray);

      setMessages(Array.from(uniqueConversationsArray));
    } catch (error) {
      console.error('Error fetching messages:', error);
      showToast({ message: 'Error loading messages', type: 'error' });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (type === "NIP4") {
      // NIP4 uses subscription system, no need to call handleAllMessages
      return;
    }
    handleAllMessages();
  }, []);

  useEffect(() => {
    if (type === "NIP4") {
      // NIP4 uses subscription system, no need to call handleAllMessages
      return;
    }
    handleAllMessages();
  }, [activeTab]);

  useEffect(() => {
    if (privateKey && publicKey && ndkSigner == null) {
      setNdkSigner(new NDKPrivateKeySigner(privateKey));
      setNdkUser(new NDKUser({
        pubkey: publicKey,
      }));
    }
  }, [privateKey, publicKey, ndkSigner, ndkUser]);

  const handleGoBack = () => {
    setSelectedConversation(null);
  };

  const handleConnect = async () => {
    const connected = await handleCheckNostrAndSendConnectDialog();
    if (connected) {
      refetch();
    }
  };

  const { data: messagesSent, isLoading: isLoadingMessagesSent } = useRoomMessages({
    roomParticipants: roomIds,
    limit: 100,
  });

  const messagesSentState = React.useMemo(() => {
    if (roomIds.length === 0 || isBack) {
      return [];
    }
    if (selectedConversation) {
      return messagesSent?.pages.flat() || [];
    }
    return [];
  }, [selectedConversation, messagesSent?.pages, isBack]);

  const handleNewMessageSent = () => {
    setShowNewMessageForm(false);
    refetch();
  };

  // Helper to get the other participant's public key
  const getOtherUserPublicKey = (conversation: any, currentUserPublicKey: string) => {
    if (!conversation) return undefined;
    if (!currentUserPublicKey) return undefined;
    if (conversation.senderPublicKey === currentUserPublicKey) return conversation.receiverPublicKey;
    return conversation.senderPublicKey;
  };

  const handleConversationClick = (item: any) => {
    // Always set senderPublicKey and receiverPublicKey so that sender is always the current user
    let sender = item?.pubkey || item?.senderPublicKey;
    console.log('sender', sender);
    let receiver = getOtherUserPublicKey(item, publicKey || '');
    console.log('item', item);
    setSelectedConversation({
      ...item,
      senderPublicKey: sender,
      receiverPublicKey: receiver,
    });
    setIsBack(false);
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

  const handleSendMessage = async (message: string) => {
    if (!message) return;
    console.log('roomIds', roomIds);
    let receiverPublicKey = roomIds.find((id) => id !== publicKey);

    // TODO auto saved message
    if (roomIds[0] === roomIds[1]) {
      receiverPublicKey = roomIds[0] ?? publicKey;
    }
    if (!receiverPublicKey && roomIds.length > 1 && roomIds[0] != roomIds[1]) {
      showToast({ message: 'Invalid receiver', type: 'error' });
      return;
    }
    console.log('receiverPublicKey', receiverPublicKey);
    await sendMessage(
      {
        content: message,
        receiverPublicKeyProps: receiverPublicKey,
      },
      {
        onSuccess: () => {
          showToast({ message: 'Message sent', type: 'success' });
        },
        onError() {
          showToast({ message: 'Error sending message', type: 'error' });
        },
      },
    );
  };

  const messages = [...(messagesSent?.pages.flat() || []), ...(incomingMessages?.pages.flat() || [])]
    .filter(msg => {
      // Only include messages where sender or receiver matches the room IDs
      return roomIds.includes(msg.senderPublicKey) && roomIds.includes(msg.receiverPublicKey);
    })
    .sort((a, b) => b.created_at - a.created_at); // Sort by timestamp, newest first

  const groupedMessages = (messages || [])
    .filter(msg => msg && typeof msg.created_at === 'number' && !isNaN(msg.created_at))
    .reduce((groups, message) => {
      const dateObj = new Date(message.created_at * 1000);
      if (isNaN(dateObj.getTime())) return groups;
      const date = dateObj.toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    }, {});

  return (
    <div className="flex flex-col h-full">

      {activeTab == "messages" && (
        <>
        </>
      )}
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'messages' && (
          <div className="h-full">
            <div className="flex justify-between gap-8">
              {selectedConversation &&
                <button
                  className="py-4"
                  onClick={() => {
                    setSelectedConversation(null);
                  }}>
                  <Icon name="BackIcon" size={20} />
                </button>
              }
              <button
                className="py-4"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <Icon name="RefreshIcon" size={20} />
                {isRefreshing && <CryptoLoading />}
              </button>
            </div>

            {selectedConversation && selectedConversation.receiverPublicKey && publicKey ? (
              <div className="flex flex-col h-full">
                <ChatConversation
                  item={selectedConversation}
                  publicKeyProps={publicKey || ''}
                  receiverPublicKey={selectedConversation.receiverPublicKey}
                  handleGoBack={handleGoBack}
                  messagesSentParents={messagesSentState}
                  type={selectedConversation?.type || "NIP4"}
                />
              </div>
            ) : (
              <div className="h-full">
                {isLoadingMessages && (
                  <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-600">Loading messages...</span>
                  </div>
                )}
                {messagesMemo?.length === 0 && !incomingMessages?.pages?.flat()?.length && !isLoadingMessages && (
                  <div className="flex items-center justify-center h-24">
                    <span className="text-gray-500">No messages found</span>
                  </div>
                )}
                <div className="overflow-y-auto h-full">
                  {messagesMemo?.map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleConversationClick(item);
                        logClickedEvent('open_conversation_nip17', 'messages_data');
                      }}
                      className="w-full p-4 border-b"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 mr-3" />
                        <div className="flex-1 text-left">
                          <p className="font-medium">
                            {item.senderPublicKey?.slice(0, 8) || item?.pubkey?.slice(0, 8) || ''}
                          </p>
                          <p className="text-sm text-gray-500 truncate"></p>
                        </div>
                      </div>
                    </button>
                  ))}
                  {messagesSent && messagesSent?.pages?.flat()?.length > 0 && messagesSent?.pages?.flat().map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleConversationClick(item);
                        logClickedEvent('open_conversation_nip17', 'messages_sent');
                      }}
                      className="w-full p-4 border-b"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 mr-3" />
                        <div className="flex-1 text-left">
                          <p className="font-medium">
                            {item.senderPublicKey?.slice(0, 8) || ''}
                          </p>
                          <p className="text-sm text-gray-500 truncate"></p>
                        </div>
                      </div>
                    </button>
                  ))}
                  {incomingMessages && incomingMessages?.pages?.flat()?.length > 0 && incomingMessages?.pages?.flat().map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleConversationClick(item);
                        logClickedEvent('open_conversation_nip17', 'incoming_messages');
                      }}
                      className="w-full p-4 border-b"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 mr-3" />
                        <div className="flex-1 text-left">
                          <p className="font-medium">
                            {item?.receiverPublicKey?.slice(0, 8) || ''}
                          </p>
                          <p className="text-sm text-gray-500 truncate"></p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="overflow-y-auto h-full">
            {contacts.data?.flat().map((contact) => (
              <div
                key={contact}
                className="p-4 border-b"
              >
                {contact}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'followers' && (
          <div className="overflow-y-auto h-full">
            {contacts.data?.flat().map((contact) => (
              <div
                key={contact}
                className="p-4 border-b"
              >
                {contact}
              </div>
            ))}
          </div>
        )}
      </div>

      {activeTab === 'direct_messages' && (
        <div className="flex justify-center p-4">
          <FormPrivateMessage onClose={() => setActiveTab('messages')} type="NIP17" />
        </div>
      )}
    </div>
  );
};

export default NostrConversationList;
