'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { checkIsConnected, deriveSharedKey, useAuth, useContacts, useGetAllMessages, useIncomingMessageUsers, useMyGiftWrapMessages, useMyMessagesSent, useNostrContext, useRoomMessages, useSendPrivateMessage, v2, useNip4Subscription } from 'afk_nostr_sdk';
import { useNostrAuth } from '@/hooks/useNostrAuth';
import { FormPrivateMessage } from './nip17/FormPrivateMessage';
import NDK, { NDKEvent, NDKKind, NDKPrivateKeySigner, NDKUser } from '@nostr-dev-kit/ndk';
import { ChatConversation } from './nip17/ChatConversation';
import { useUIStore } from '@/store/uiStore';
import CryptoLoading from '@/components/small/crypto-loading';
import { logClickedEvent } from '@/lib/analytics';
import { Icon } from '@/components/small/icon-component';

interface NostrConversationListProps {
  type: "NIP4" | "NIP17";
  setType?: (type: "NIP4" | "NIP17") => void;
}

export const NostrConversationList: React.FC<NostrConversationListProps> = ({ type, setType }) => {
  const { publicKey, privateKey } = useAuth();
  const { handleCheckNostrAndSendConnectDialog } = useNostrAuth();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"messages" | "contacts" | "followers" | "direct_messages">('messages');
  const [isProcessingMessages, setIsProcessingMessages] = useState(false);
  const [messagesData, setMessages] = useState<any>([]);
  const [isBack, setIsBack] = useState(false);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      // The subscription hook already handles adding to messages state
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

  // Process NIP4 messages into conversation format
  const processNip4Messages = useCallback(() => {
    if (!nip4Messages || nip4Messages.length === 0) return [];

    const conversations = new Map();
    
    nip4Messages.forEach((event: any) => {
      // Determine the other participant in the conversation
      const otherParticipant = event.pubkey === publicKey 
        ? event.tags?.find((tag: any) => tag[0] === 'p')?.[1] 
        : event.pubkey;
      
      if (!otherParticipant) return;

      const conversationKey = otherParticipant;
      
      if (!conversations.has(conversationKey)) {
        conversations.set(conversationKey, {
          id: conversationKey,
          pubkey: otherParticipant,
          senderPublicKey: event.pubkey,
          receiverPublicKey: otherParticipant,
          lastMessage: event,
          created_at: event.created_at,
          type: "NIP4"
        });
      } else {
        // Update with most recent message
        const existing = conversations.get(conversationKey);
        if (event.created_at > existing.lastMessage.created_at) {
          existing.lastMessage = event;
          existing.created_at = event.created_at;
        }
      }
    });

    return Array.from(conversations.values()).sort((a, b) => b.created_at - a.created_at);
  }, [nip4Messages, publicKey]);

  // Update messages data when NIP4 messages change
  useEffect(() => {
    if (type === "NIP4") {
      const processedMessages = processNip4Messages();
      setMessages(processedMessages);
    }
  }, [nip4Messages, type, processNip4Messages]);

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

  // Legacy fetch functions for NIP17 (keeping for backward compatibility)
  const fetchMessagesSent = async (ndk: NDK, publicKey: string, limit: number): Promise<NDKEvent[]> => {
    try {
      await checkIsConnected(ndk);
      console.log("fetchMessagesSent");
      const directMessagesSent = await ndk.fetchEvents({
        kinds: [4 as NDKKind],
        authors: [publicKey],
        limit: limit || 10,
      });
      console.log("directMessagesSent", directMessagesSent);
      return Array.from(directMessagesSent);
    } catch (error) {
      console.log("error", error);
      return [];
    }
  };

  const fetchMessagesReceived = async (ndk: NDK, publicKey: string, limit: number): Promise<NDKEvent[]> => {
    try {
      console.log("fetchMessagesReceived");
      await checkIsConnected(ndk);
      const directMessagesReceived = await ndk.fetchEvents({
        kinds: [4],
        '#p': [publicKey],
        limit: limit || 30,
      });
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
    console.log("publicKey", publicKey);
    const messages = await fetchMessagesSent(ndk, publicKey, 10);
    console.log("messages Sent", messages);

    const messagesReceived = await fetchMessagesReceived(ndk, publicKey, 10);
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

    setMessages((prev: any) => [...prev, Array.from(uniqueConversationsArray)]);
  };

  useEffect(() => {
    if (type === "NIP4") {
      // NIP4 uses subscription system, no need to call handleAllMessages
      return;
    }
    handleAllMessages();
  }, []);

  console.log("selectedConversation", selectedConversation);

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
            <button
              className="py-4"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <Icon name="RefreshIcon" size={20} />
              {isRefreshing && <CryptoLoading />}
            </button>
            
            {selectedConversation && selectedConversation.receiverPublicKey && publicKey ? (
              <div className="flex flex-col h-full">
                <ChatConversation
                  item={selectedConversation}
                  publicKeyProps={publicKey || ''}
                  receiverPublicKey={selectedConversation.receiverPublicKey || selectedConversation.pubkey || ''}
                  handleGoBack={handleGoBack}
                  messagesSentParents={messagesSentState}
                  type={type}
                />
              </div>
            ) : (
              <div className="h-full">
                {messagesData.length === 0 && !incomingMessages?.pages?.flat()?.length && (
                  <div className="flex items-center justify-center h-24">
                    {type === "NIP4" && isLoadingNip4 ? (
                      <div className="flex items-center space-x-2">
                        <CryptoLoading />
                        <span>Loading messages...</span>
                      </div>
                    ) : (
                      <span className="text-gray-500">No conversations yet</span>
                    )}
                  </div>
                )}
                
                <div className="overflow-y-auto h-full">
                  {messagesData.map((item: any) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleConversationClick(item);
                        logClickedEvent('open_conversation_nip17', 'messages_data');
                      }}
                      className="w-full p-4 hover:bg-gray-100 border-b"
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
                      className="w-full p-4 hover:bg-gray-100 border-b"
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
                      className="w-full p-4 hover:bg-gray-100 border-b"
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
                className="p-4 hover:bg-gray-100 border-b"
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
                className="p-4 hover:bg-gray-100 border-b"
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
