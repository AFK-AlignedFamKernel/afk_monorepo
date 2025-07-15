'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { checkIsConnected, deriveSharedKey, useAuth, useContacts, useGetAllMessages, useIncomingMessageUsers, useMyGiftWrapMessages, useMyMessagesSent, useNostrContext, useRoomMessages, useSendPrivateMessage, v2 } from 'afk_nostr_sdk';
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
  const messagesMemo = useMemo(() => {

    // console.log("messagesData", messagesData);
    const unique = new Map();
    messagesData.forEach((msg: any) => {

      let tagReceiver = msg.tags?.find((t: any) => t[0] === 'p' && t[1] === publicKey);
      // console.log("tagReceiver", tagReceiver);
      // console.log("msg", msg);
      if (
        msg.type === "NIP4" &&
        (tagReceiver || msg.pubkey === publicKey)
      ) {
        unique.set(msg.id, msg);
      }
    });
    // Sort by created_at
    // console.log("unique", unique);
    return Array.from(unique.values()).sort((a, b) => a.created_at - b.created_at);

  }, [messagesData]);
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

  // const { data: allMessages, isLoading: isLoadingAllMessages } = useGetAllMessages();
  // console.log('allMessages', allMessages);

  const subscriptionEvent = () => {
    console.log("subscriptionEvent");
    const subscription = ndk.subscribe({
      kinds: [4 as NDKKind],
      authors: [publicKey],
      limit: 10,
    });

    subscription.on("event:dup", (event) => {
      console.log("event sent dup", event);
      setMessages((prev: any) => [...prev, { ...event, senderPublicKey: event.pubkey, type: "NIP4" }]);
    });


    // subscription.on("event", (event) => {
    //   console.log("event sent", event);
    //   setMessages((prev: any) => [...prev, { ...event, senderPublicKey: event.pubkey, type: "NIP4" }]);
    // });

    const subscriptionReceived = ndk.subscribe({
      kinds: [4 as NDKKind],
      '#p': [publicKey],
      limit: 10,
    });

    // subscriptionReceived.on("event", (event) => {
    //   console.log("event received", event);
    //   setMessages((prev: any) => [...prev, { ...event, senderPublicKey: event.pubkey, type: "NIP4" }]);
    // });

    subscriptionReceived.on("event:dup", (event) => {
      console.log("event received dup", event);
      setMessages((prev: any) => [...prev, { ...event, senderPublicKey: event.pubkey, type: "NIP4" }]);
    });
  }
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
    console.log("publicKey", publicKey);
    const messages = await fetchMessagesSent(ndk, publicKey, 10);
    console.log("messages Sent", messages);

    const messagesReceived = await fetchMessagesReceived(ndk, publicKey, 10);
    console.log("messagesReceived", messagesReceived);
    const allMessages = [...messages, ...messagesReceived];
    // console.log("allMessages", allMessages);

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

    // Only add Nostr event if its pubkey is not already included in the accumulator
    const seenPubkeys = new Set();
    uniqueDm = uniqueDm.filter((item: any) => {
      if (!item?.pubkey) return false;
      if (seenPubkeys.has(item.pubkey)) {
        return false;
      }
      seenPubkeys.add(item.pubkey);
      return true;
    });

    // console.log("uniqueDm", uniqueDm);
    // const uniqueConversationsArray = Array.from(new Set(uniqueDm));
    // console.log("uniqueConversationsArray", uniqueConversationsArray);

    // setMessages((prev: any) => [...prev, Array.from(uniqueConversationsArray)]);
  };

  useEffect(() => {
    console.log("isNostrAuthed", isNostrAuthed);
    if (isNostrAuthed) {
      subscriptionEvent();
      handleAllMessages();
    }
  }, [isNostrAuthed]);

  useEffect(() => {
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
    // console.log('sender', sender);
    let receiver = getOtherUserPublicKey(item, publicKey || '');
    // console.log('item', item);
    setSelectedConversation({
      ...item,
      senderPublicKey: sender,
      receiverPublicKey: receiver,
    });
    setIsBack(false);
  };

  // console.log("selectedConversation", selectedConversation);

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
    // console.log('roomIds', roomIds);
    let receiverPublicKey = roomIds.find((id) => id !== publicKey);


    // TODO auto saved message
    if (roomIds[0] === roomIds[1]) {
      receiverPublicKey = roomIds[0] ?? publicKey;
    }
    if (!receiverPublicKey && roomIds.length > 1 && roomIds[0] != roomIds[1]) {
      showToast({ message: 'Invalid receiver', type: 'error' });
      return;
    }
    // console.log('receiverPublicKey', receiverPublicKey);
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
                onClick={() => {
                  subscriptionEvent();
                  handleAllMessages();
                }}>
                <Icon name="RefreshIcon" size={20} />
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
                {messagesMemo?.length === 0 && !incomingMessages?.pages?.flat()?.length && (
                  <div className="flex items-center justify-center h-24"></div>
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
