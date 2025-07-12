'use client';

import React, { useEffect, useState } from 'react';
import { deriveSharedKey, useAuth, useContacts, useIncomingMessageUsers, useMyGiftWrapMessages, useMyMessagesSent, useNostrContext, useRoomMessages, useSendPrivateMessage, v2 } from 'afk_nostr_sdk';
import { useNostrAuth } from '@/hooks/useNostrAuth';
import { FormPrivateMessage } from './FormPrivateMessage';
import { NDKPrivateKeySigner, NDKUser } from '@nostr-dev-kit/ndk';
import { ChatConversation } from './ChatConversation';
import { useUIStore } from '@/store/uiStore';
import CryptoLoading from '@/components/small/crypto-loading';
import { logClickedEvent } from '@/lib/analytics';

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

  const { data: incomingMessages, isPending, refetch } = useIncomingMessageUsers({
    limit: 100,
  });
  // const { data: dataMessagesSent } = useMyMessagesSent();
  // const giftMessages = useMyGiftWrapMessages();
  const contacts = useContacts();
  const [message, setMessage] = useState<string | null>(null);

  const { ndk } = useNostrContext();
  const [ndkSigner, setNdkSigner] = useState<NDKPrivateKeySigner | null>(null);
  const [ndkUser, setNdkUser] = useState<NDKUser | null>(null);
  const { mutateAsync: sendMessage } = useSendPrivateMessage();
  const roomIds = selectedConversation
    ? [selectedConversation?.senderPublicKey, selectedConversation?.receiverPublicKey]
    : [];
  // const { data: messagesSentRoom, fetchNextPage, hasNextPage, isFetchingNextPage } = useMyMessagesSent({
  //   authors: roomIds ?? [],
  // });
  // console.log('messagesSentRoom', messagesSentRoom?.pages?.flat()?.length);
  const { showToast } = useUIStore();
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
    let sender = publicKey || '';
    let receiver = getOtherUserPublicKey(item, publicKey || '');
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
          //   queryClient.invalidateQueries({
          //     queryKey: ['messagesSent'],
          //   });
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

  // const groupedMessages = messages.reduce((groups: any, message) => {
  //   const date = new Date(message.created_at * 1000).toLocaleDateString();
  //   if (!groups[date]) {
  //     groups[date] = [];
  //   }
  //   groups[date].push(message);
  //   return groups;
  // }, {});
  // console.log('messages', messages);
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

  // console.log('groupedMessages', groupedMessages);


  return (
    <div className="flex flex-col h-full">

      {activeTab == "messages" && (

        <>
          {/* {giftMessages.data?.pages.flat().map((item: any) => (
            <div key={item.id}>
              <p>{item.content}</p>
              <p>{ndkSigner?.decrypt(ndkUser, item?.content, "nip44")}</p>
            </div>
          ))}

          {incomingMessages?.pages.flat().map((item: any) => (
            <div key={item.id}>
              {item.content}
            </div>
          ))}

          {dataMessagesSent?.pages.flat().map((item: any) => (
            <div key={item.id}>
              {item.content}
            </div>
          ))} */}
        </>
      )}
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'messages' && (
          <div className="h-full">
            {selectedConversation && selectedConversation.receiverPublicKey && publicKey ? (
              <div className="flex flex-col h-full">
                <ChatConversation
                  item={selectedConversation}
                  publicKeyProps={publicKey || ''}
                  receiverPublicKey={selectedConversation.receiverPublicKey || ''}
                  handleGoBack={handleGoBack}
                  messagesSentParents={messagesSentState}
                />
                {/* <div className="flex">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 p-2 border rounded-l"
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-r"
                    onClick={() => {
                      if (message) {
                        handleSendMessage(message);
                        logClickedEvent('send_message_nip17', 'messages_data');
                      }
                    }}
                  >
                    Send
                  </button>
                </div> */}
              </div>
            ) : (
              <div className="h-full">
                {messagesData.length === 0 && !incomingMessages?.pages?.flat()?.length && (
                  <div className="flex items-center justify-center h-24"></div>
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
                            {item.senderPublicKey?.slice(0, 8) || ''}
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
