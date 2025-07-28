'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth, useContacts, useNostrContext, useRelayAuthInit, useNip17Conversations, useNip17MessagesBetweenUsers, useSendNip17Message } from 'afk_nostr_sdk';
import { useNip44Message } from 'afk_nostr_sdk';
import { useNostrAuth } from '@/hooks/useNostrAuth';
import { FormPrivateMessage } from './FormPrivateMessage';
import { ChatConversation } from './ChatConversation';
import { useUIStore } from '@/store/uiStore';
import CryptoLoading from '@/components/small/crypto-loading';
import { logClickedEvent } from '@/lib/analytics';
import { Icon } from '@/components/small/icon-component';

interface NostrConversationListProps {
  type: "NIP4" | "NIP17" | "NIP44";
  setType?: (type: "NIP4" | "NIP17" | "NIP44") => void;
}

export const NostrConversationList: React.FC<NostrConversationListProps> = ({ type, setType }) => {
  const { publicKey, privateKey } = useAuth();
  const { handleCheckNostrAndSendConnectDialog } = useNostrAuth();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"messages" | "contacts" | "followers" | "direct_messages">('messages');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use the new relay auth initialization
  const { isAuthenticated, isInitializing, hasError, errorMessage, initializeAuth } = useRelayAuthInit();
  
  const [isBack, setIsBack] = useState(false);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);

  const contacts = useContacts();
  const { ndk } = useNostrContext();
  const { mutateAsync: sendNip17Message } = useSendNip17Message();
  const { mutateAsync: sendNip44Message } = useNip44Message();
  const { showToast } = useUIStore();

  // Use NIP-17 hooks for conversations and messages
  const { 
    data: conversations, 
    isLoading: isLoadingConversations, 
    refetch: refetchConversations 
  } = useNip17Conversations({
    enabled: type === "NIP17" && !!publicKey && !!privateKey,
  });

  const { 
    data: messagesBetweenUsers, 
    isLoading: isLoadingMessages,
    refetch: refetchMessages 
  } = useNip17MessagesBetweenUsers(
    selectedConversation?.participant || '',
    {
      enabled: type === "NIP17" && !!selectedConversation?.participant && !!publicKey && !!privateKey,
    }
  );

  console.log("conversations", conversations);

  // Handle refresh for NIP-17
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (type === "NIP17") {
        await Promise.all([refetchConversations(), refetchMessages()]);
        showToast({ message: 'Messages refreshed', type: 'success' });
      }
    } catch (error) {
      console.error('Error refreshing messages:', error);
      showToast({ message: 'Error refreshing messages', type: 'error' });
    } finally {
      setIsRefreshing(false);
    }
  }, [type, refetchConversations, refetchMessages, showToast]);

  const handleGoBack = () => {
    setSelectedConversation(null);
  };

  const handleConnect = async () => {
    const connected = await handleCheckNostrAndSendConnectDialog();
    if (connected) {
      refetchConversations();
    }
  };

  const handleNewMessageSent = () => {
    setShowNewMessageForm(false);
    refetchConversations();
    refetchMessages();
  };

  // Helper to get the other participant's public key
  const getOtherUserPublicKey = (conversation: any, currentUserPublicKey: string) => {
    if (!conversation) return undefined;
    if (!currentUserPublicKey) return undefined;
    return conversation.participant;
  };

  const handleConversationClick = (conversation: any) => {
    console.log("conversation", conversation);
    setSelectedConversation({
      ...conversation,
      senderPublicKey: publicKey,
      receiverPublicKey: conversation.participant,
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
    if (!message || !selectedConversation?.receiverPublicKey) return;
    
    try {
      if (type === "NIP17") {
        await sendNip17Message(
          {
            receiverPublicKey: selectedConversation.receiverPublicKey,
            message: message,
          },
          {
            onSuccess: () => {
              showToast({ message: 'Message sent', type: 'success' });
              refetchMessages();
            },
            onError() {
              showToast({ message: 'Error sending message', type: 'error' });
            },
          },
        );
      } else if (type === "NIP44") {
        await sendNip44Message(
          {
            content: message,
            receiverPublicKey: selectedConversation.receiverPublicKey,
          },
          {
            onSuccess: () => {
              showToast({ message: 'NIP-44 message sent', type: 'success' });
              refetchMessages();
            },
            onError() {
              showToast({ message: 'Error sending NIP-44 message', type: 'error' });
            },
          },
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast({ message: 'Error sending message', type: 'error' });
    }
  };

  return (
    <div className="flex flex-col h-full">
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
                  messagesSentParents={messagesBetweenUsers?.pages?.flat() || []}
                  type="NIP17"
                />
              </div>
            ) : (
              <div className="h-full">
                {isLoadingConversations && (
                  <div className="flex items-center justify-center h-24">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-600">Loading conversations...</span>
                  </div>
                )}
                {conversations?.pages?.length === 0 && !isLoadingConversations && (
                  <div className="flex items-center justify-center h-24">
                    <span className="text-gray-500">No conversations found</span>
                  </div>
                )}
                <div className="overflow-y-auto h-full">
                  {conversations && conversations.pages.length > 0 && conversations?.pages[0]?.conversations?.map((conversation: any) => (
                    <button
                      key={conversation.participant}
                      onClick={() => {
                        handleConversationClick(conversation);
                        logClickedEvent('open_conversation_nip17', 'conversations');
                      }}
                      className="w-full p-4 border-b hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 mr-3" />
                        <div className="flex-1 text-left">
                          <p className="font-medium">
                            {conversation.participant?.slice(0, 8) || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {conversation.lastMessageContent || 'No messages yet'}
                          </p>
                          <p className="text-xs text-gray-400">
                            {conversation.messageCount} message{conversation.messageCount !== 1 ? 's' : ''}
                          </p>
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
