'use client';

import React, { useEffect, useState } from 'react';
import { useAuth, useContacts, useIncomingMessageUsers, useMyGiftWrapMessages, useMyMessagesSent, useNostrContext, useRoomMessages } from 'afk_nostr_sdk';
import { useNostrAuth } from '@/hooks/useNostrAuth';
import { FormPrivateMessage } from './FormPrivateMessage';
import { NDKPrivateKeySigner, NDKUser } from '@nostr-dev-kit/ndk';
import { ChatConversation } from './ChatConversation';

export const NostrConversationList: React.FC = () => {
  const { publicKey, privateKey } = useAuth();
  const { handleCheckNostrAndSendConnectDialog } = useNostrAuth();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('messages');
  const [isProcessingMessages, setIsProcessingMessages] = useState(false);
  const [messagesData, setMessages] = useState<any>([]);
  const [isBack, setIsBack] = useState(false);
  const [showNewMessageForm, setShowNewMessageForm] = useState(false);

  const { data: incomingMessages, isPending, refetch } = useIncomingMessageUsers();
  console.log('data?.pages.flat()', incomingMessages?.pages.flat());

  const { data: dataMessagesSent } = useMyMessagesSent();
  const giftMessages = useMyGiftWrapMessages();
  const contacts = useContacts();

  console.log('giftMessages', giftMessages?.data?.pages.flat());

  const { ndk } = useNostrContext();
  const [ndkSigner, setNdkSigner] = useState<NDKPrivateKeySigner | null>(null);
  const [ndkUser, setNdkUser] = useState<NDKUser | null>(null);

  useEffect(() => {
    if (privateKey && publicKey && ndkSigner == null) {
      setNdkSigner(new NDKPrivateKeySigner(privateKey));
      setNdkUser(new NDKUser({
        pubkey: publicKey,
      }));
    }
  }, [privateKey, publicKey, ndkSigner, ndkUser]);
  console.log("messageData", messagesData)
  // useEffect(() => {
  //   const processMessages = async () => {
  //     if (publicKey && !isProcessingMessages) {
  //       setIsProcessingMessages(true);
  //       try {
  //         // await refetch();
  //       } catch (error) {
  //         console.error('Error processing messages:', error);
  //       } finally {
  //         setIsProcessingMessages(false);
  //       }
  //     }
  //   };

  //   if (publicKey) {
  //     processMessages();
  //   }
  // }, [publicKey, refetch]);

  // useEffect(() => {
  //   if (data && data?.pages?.flat().length > 0) {
  //     setMessages(data?.pages.flat());
  //   }
  // }, [data]);

  const handleGoBack = () => {
    setSelectedConversation(null);
  };

  const handleConnect = async () => {
    const connected = await handleCheckNostrAndSendConnectDialog();
    if (connected) {
      refetch();
    }
  };

  const roomIds = selectedConversation
    ? [selectedConversation?.senderPublicKey, selectedConversation?.receiverPublicKey]
    : [];

  const messagesSent = useRoomMessages({
    roomParticipants: roomIds,
  });

  const messagesSentState = React.useMemo(() => {
    if (roomIds.length === 0 || isBack) {
      return [];
    }
    if (selectedConversation) {
      return messagesSent.data?.pages.flat() || [];
    }
    return [];
  }, [selectedConversation, messagesSent.data?.pages, isBack]);

  const handleNewMessageSent = () => {
    setShowNewMessageForm(false);
    refetch();
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
            {selectedConversation ? (
              <div className="flex flex-col h-full">
                {/* Chat Header */}
                <div className="flex items-center p-4 border-b">
                  <button
                    onClick={handleGoBack}
                    className="mr-2 p-2 hover:bg-gray-100 rounded"
                  >
                    ←
                  </button>
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 mr-2" />
                    <span>{selectedConversation.senderPublicKey.slice(0, 8)}</span>
                  </div>
                  <ChatConversation
                    item={selectedConversation}
                    publicKey={publicKey}
                    receiverPublicKey={selectedConversation.receiverPublicKey}
                    handleGoBack={handleGoBack}
                    messagesSentParents={messagesSentState}
                  />
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4">
                  {messagesSentState.map((msg: any) => (
                    <div
                      key={msg.id}
                      className={`mb-4 ${msg.senderPublicKey === selectedConversation.senderPublicKey
                        ? 'text-left'
                        : 'text-right'
                        }`}
                    >
                      <div
                        className={`inline-block p-3 rounded-lg ${msg.senderPublicKey === selectedConversation.senderPublicKey
                          ? 'bg-gray-100'
                          : 'bg-blue-500 text-white'
                          }`}
                      >
                        {ndkSigner?.decrypt(ndkUser, msg?.content, "nip44")}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t">
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      className="flex-1 p-2 border rounded-l"
                    />
                    <button className="px-4 py-2 bg-blue-500 text-white rounded-r">
                      Send
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full">
                {messagesData.length === 0 && !incomingMessages?.pages.flat().length ? (
                  <div className="flex items-center justify-center h-24">
                    <p className="text-gray-500">You don't have any messages</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto h-full">
                    {/* Incoming Messages */}
                    {messagesData.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedConversation(item);
                          setIsBack(false);
                        }}
                        className="w-full p-4 hover:bg-gray-100 border-b"
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-200 mr-3" />
                          <div className="flex-1 text-left">
                            <p className="font-medium">
                              {item.senderPublicKey.slice(0, 8)}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {ndkSigner?.decrypt(ndkUser, item?.content, "nip44")}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}

                    {/* Sent Messages */}
                    {incomingMessages?.pages.flat()?.length > 0 && incomingMessages?.pages.flat()?.map((item: any) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedConversation({
                            senderPublicKey: item.receiverPublicKey,
                            receiverPublicKey: publicKey,
                            content: item.content,
                            id: item.id
                          });
                          setIsBack(false);
                        }}
                        className="w-full p-4 hover:bg-gray-100 border-b"
                      >
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-200 mr-3" />
                          <div className="flex-1 text-left">
                            <p className="font-medium">
                              {item?.receiverPublicKey?.slice(0, 8)}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {item?.content &&
                                ndkSigner?.decrypt(ndkUser, item?.content, "nip44")
                              }

                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* New Message Button and Form */}
                <>
                  <button
                    className="fixed bottom-4 right-4 w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center"
                    onClick={() => setShowNewMessageForm(true)}
                  >
                    +
                  </button>

                  {showNewMessageForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="bg-white rounded-lg w-full max-w-md">
                        <FormPrivateMessage
                          onClose={() => setShowNewMessageForm(false)}
                          onMessageSent={handleNewMessageSent}
                        />
                      </div>
                    </div>
                  )}
                </>
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
    </div>
  );
};

export default NostrConversationList;
