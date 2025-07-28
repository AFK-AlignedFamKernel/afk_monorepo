'use client';

import React, { useState } from 'react';
import { useAuth, useNip17Messages, useSendNip17Message, useNip17MessagesBetweenUsers, useNip17SavedMessages } from 'afk_nostr_sdk';
import { useUIStore } from '@/store/uiStore';
import { Icon } from '@/components/small/icon-component';
import CryptoLoading from '@/components/small/crypto-loading';
import { formatDistanceToNow } from 'date-fns';

export const SavedMessages: React.FC = () => {
  const { publicKey, privateKey } = useAuth();
  const { showToast } = useUIStore();
  const [message, setMessage] = useState('');
  const [isProcessingMessage, setIsProcessingMessage] = useState(false);

  // Use the regular NIP-17 hooks for now (we'll update when the saved message hooks are fixed)
  const { 
    data: savedMessages, 
    isLoading: isLoadingMessages, 
    refetch: refetchMessages 
  } = useNip17SavedMessages({
    enabled: !!publicKey && !!privateKey,
    limit: 50,
  });

  // Also fetch all messages as a fallback to catch any self-messages
  const { 
    data: allMessagesData, 
    isLoading: isLoadingAllMessages 
  } = useNip17Messages({
    enabled: !!publicKey && !!privateKey,
    limit: 50,
  });

  const { mutateAsync: sendSavedMessage } = useSendNip17Message();

  const handleSendMessage = async () => {
    if (!message.trim() || !publicKey || !privateKey) return;

    console.log('SavedMessages: Sending message to self:', {
      message: message,
      publicKey: publicKey,
      hasPrivateKey: !!privateKey
    });

    setIsProcessingMessage(true);
    try {
      await sendSavedMessage(
        {
          receiverPublicKey: publicKey, // Send to yourself
          message: message,
        },
        {
          onSuccess: () => {
            console.log('SavedMessages: Message sent successfully');
            setMessage('');
            showToast({ message: 'Saved message sent', type: 'success' });
            refetchMessages();
          },
          onError() {
            console.error('SavedMessages: Error sending message');
            showToast({ message: 'Error sending saved message', type: 'error' });
          },
        },
      );
    } catch (error) {
      console.error('Error sending saved message:', error);
      showToast({ message: 'Error sending saved message', type: 'error' });
    } finally {
      setIsProcessingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center p-4 space-y-4">
        <h2 className="text-xl font-semibold">Connect your Nostr account</h2>
        <p className="text-gray-500">You need to connect your account to use saved messages</p>
      </div>
    );
  }

  // Extract messages from both hooks
  const savedMessagesList = savedMessages?.pages?.flat().map(page => {
    if (page && page.messages && Array.isArray(page.messages)) {
      return page.messages;
    }
    if (page && Array.isArray(page)) {
      return page;
    }
    return [];
  }).flat() || [];

  const allMessagesList = allMessagesData?.pages?.flat().map(page => {
    if (page && page.messages && Array.isArray(page.messages)) {
      return page.messages;
    }
    if (page && Array.isArray(page)) {
      return page;
    }
    return [];
  }).flat() || [];

  // Combine and deduplicate messages
  const allMessages = [...savedMessagesList, ...allMessagesList];
  const uniqueMessages = allMessages.filter((msg, index, self) => 
    index === self.findIndex(m => m.id === msg.id)
  );

  console.log('SavedMessages: savedMessagesList length:', savedMessagesList.length);
  console.log('SavedMessages: allMessagesList length:', allMessagesList.length);
  console.log('SavedMessages: uniqueMessages length:', uniqueMessages.length);
  console.log('SavedMessages: uniqueMessages sample:', uniqueMessages.slice(0, 3).map(msg => ({
    id: msg?.id,
    actualSenderPubkey: msg?.actualSenderPubkey,
    actualReceiverPubkey: msg?.actualReceiverPubkey,
    hasContent: !!(msg?.decryptedContent || msg?.content)
  })));

  // Filter to only show self-messages (where sender and receiver are the same)
  const processedMessages = uniqueMessages
    .filter((msg: any) => {
      console.log('SavedMessages: Checking message:', {
        id: msg?.id,
        actualSenderPubkey: msg?.actualSenderPubkey,
        actualReceiverPubkey: msg?.actualReceiverPubkey,
        pubkey: msg?.pubkey,
        publicKey,
        hasDecryptedContent: !!msg?.decryptedContent,
        hasContent: !!msg?.content,
        decryptedContent: msg?.decryptedContent,
        content: msg?.content
      });

      // Validate that we have the required fields
      if (!msg?.actualSenderPubkey || !msg?.actualReceiverPubkey) {
        console.log('SavedMessages: Missing sender or receiver pubkey');
        return false;
      }

      // STRICT validation: This must be a true self-message
      // Both sender and receiver must be the current user
      const isSelfMessage = msg.actualSenderPubkey === publicKey && 
                           msg.actualReceiverPubkey === publicKey;

      // Also check if the message has content
      const hasContent = msg && (msg.decryptedContent || msg.content);

      // Additional validation: ensure this is not a message between two different users
      const isBetweenDifferentUsers = msg.actualSenderPubkey !== msg.actualReceiverPubkey;
      if (isBetweenDifferentUsers) {
        console.log('SavedMessages: Excluding message between different users');
        return false;
      }

      console.log('SavedMessages: Message filtering:', {
        isSelfMessage,
        hasContent,
        isBetweenDifferentUsers,
        willInclude: isSelfMessage && hasContent && !isBetweenDifferentUsers,
        reason: isSelfMessage && hasContent && !isBetweenDifferentUsers ? 'Valid self-message' : 
                !isSelfMessage ? 'Not a self-message' : 
                !hasContent ? 'No content' : 'Between different users'
      });

      return isSelfMessage && hasContent && !isBetweenDifferentUsers;
    })
    .map((msg: any) => ({
      id: msg.id,
      content: msg.decryptedContent || msg.content || '[Failed to decrypt]',
      created_at: msg.created_at,
      timestamp: new Date(msg.created_at * 1000),
    }))
    .sort((a: any, b: any) => a.created_at - b.created_at);

  console.log('SavedMessages: processedMessages length:', processedMessages.length);
  console.log('SavedMessages: processedMessages:', processedMessages);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center p-4 border-b">
        <div className="flex items-center flex-1">
          <Icon name="CommentIcon" size={24} className="mr-3" />
          <div>
            <h3 className="font-medium">Saved Messages</h3>
            <p className="text-sm text-gray-500">Your personal notes and saved messages</p>
          </div>
        </div>
        <button
          onClick={() => refetchMessages()}
          disabled={isLoadingMessages}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <Icon name="RefreshIcon" size={20} />
          {isLoadingMessages && <CryptoLoading />}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(isLoadingMessages || isLoadingAllMessages) ? (
          <div className="flex items-center justify-center h-24">
            <CryptoLoading />
            <span className="ml-2 text-gray-600">Loading saved messages...</span>
          </div>
        ) : processedMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Icon name="CommentIcon" size={48} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">No saved messages yet</h3>
            <p className="text-sm">Start by sending yourself a message below</p>
          </div>
        ) : (
          processedMessages.map((msg: any) => (
            <div
              key={msg.id}
              className="flex justify-start"
            >
              <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-blue-100 border border-blue-200">
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs mt-1">
                  {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message to save..."
            className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
            disabled={isProcessingMessage}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isProcessingMessage}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessingMessage ? (
              <CryptoLoading />
            ) : (
              <Icon name="SendIcon" size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SavedMessages; 