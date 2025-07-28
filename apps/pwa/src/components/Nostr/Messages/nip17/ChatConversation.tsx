// apps/pwa/src/components/Nostr/Messages/ChatConversation.tsx
// 'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { useAuth, useSendNip17Message, useProfile, useNostrContext, useRelayAuthInit, useNip17MessagesBetweenUsers } from 'afk_nostr_sdk';
import { useQueryClient } from '@tanstack/react-query';
import CryptoLoading from '@/components/small/crypto-loading';
import { logClickedEvent } from '@/lib/analytics';
import { useUIStore } from '@/store/uiStore';
import { Icon } from '@/components/small/icon-component';
import { nip04 } from 'nostr-tools';

interface ChatProps {
    item: any;
    publicKeyProps: string;
    receiverPublicKey: string;
    handleGoBack: () => void;
    messagesSentParents?: any[];
    type: "NIP4" | "NIP17";
}

export const ChatConversation: React.FC<ChatProps> = ({
    item,
    publicKeyProps,
    receiverPublicKey,
    handleGoBack,
    messagesSentParents = [],
    type
}) => {
    const { publicKey, privateKey } = useAuth();
    const { mutateAsync: sendMessage } = useSendNip17Message();
    const { showToast } = useUIStore();
    const [message, setMessage] = useState('');
    const [isProcessingMessage, setIsProcessingMessage] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { data: receiverProfile } = useProfile({ publicKey: receiverPublicKey });
    const queryClient = useQueryClient();

    // Use the messages passed from parent component instead of calling the hook again
    const messagesData = { pages: messagesSentParents };
    const isLoadingMessages = false; // We're not loading since data is passed from parent
    const refetchMessages = () => {}; // No-op since parent handles refetching

    console.log('ChatConversation: messagesSentParents:', messagesSentParents);
    console.log('ChatConversation: messagesData:', messagesData);
    console.log('ChatConversation: messagesData.pages:', messagesData.pages);
    console.log('ChatConversation: messagesData.pages[0]:', messagesData.pages?.[0]);

    // Process messages for NIP-17
    const processedMessages = useMemo(() => {
        console.log('ChatConversation: messagesData:', messagesData);
        console.log('ChatConversation: receiverPublicKey:', receiverPublicKey);
        console.log('ChatConversation: publicKey:', publicKey);
        
        if (type === "NIP17" && messagesData?.pages) {
            // Extract messages from the pages structure
            const allMessages = messagesData.pages.flat().map(page => {
                console.log('ChatConversation: Processing page:', page);
                // Handle the format where each page has a messages property (from useNip17MessagesBetweenUsers)
                if (page && page.messages && Array.isArray(page.messages)) {
                    console.log('ChatConversation: Found messages array in page:', page.messages);
                    return page.messages;
                }
                // Handle direct array format
                if (page && Array.isArray(page)) {
                    console.log('ChatConversation: Found direct array page:', page);
                    return page;
                }
                console.log('ChatConversation: No valid message structure found in page:', page);
                return [];
            }).flat();
            
            console.log('ChatConversation: allMessages:', allMessages);
            console.log('ChatConversation: allMessages length:', allMessages.length);
            
            // Debug: Log each message to understand the structure
            allMessages.forEach((msg, index) => {
                console.log(`ChatConversation: Message ${index}:`, {
                    id: msg?.id,
                    actualSenderPubkey: msg?.actualSenderPubkey,
                    actualReceiverPubkey: msg?.actualReceiverPubkey,
                    pubkey: msg?.pubkey,
                    hasDecryptedContent: !!msg?.decryptedContent,
                    hasContent: !!msg?.content,
                    decryptedContent: msg?.decryptedContent,
                    content: msg?.content
                });
            });
            
            const filteredMessages = allMessages.filter((msg: any) => {
                const hasContent = msg && (msg.decryptedContent || msg.content);
                if (!hasContent) {
                    console.log('ChatConversation: Filtering out message without content:', msg);
                    return false;
                }
                
                // Only include messages that are part of this conversation
                const actualSenderPubkey = msg.actualSenderPubkey || msg.pubkey;
                const actualReceiverPubkey = msg.actualReceiverPubkey;
                
                // Check if this message is between the current user and the conversation participant
                const isFromUsToThem = actualSenderPubkey === publicKey && actualReceiverPubkey === receiverPublicKey;
                const isFromThemToUs = actualSenderPubkey === receiverPublicKey && actualReceiverPubkey === publicKey;
                const isSelfMessage = actualSenderPubkey === actualReceiverPubkey && 
                    (actualSenderPubkey === publicKey || actualSenderPubkey === receiverPublicKey);
                
                const isPartOfConversation = isFromUsToThem || isFromThemToUs || isSelfMessage;
                
                console.log('ChatConversation: Message filtering check:', {
                    actualSenderPubkey,
                    actualReceiverPubkey,
                    publicKey,
                    receiverPublicKey,
                    isFromUsToThem,
                    isFromThemToUs,
                    isSelfMessage,
                    isPartOfConversation
                });
                
                if (!isPartOfConversation) {
                    console.log('ChatConversation: Filtering out message not part of conversation');
                    return false;
                }
                
                return true;
            });
            
            console.log('ChatConversation: filteredMessages:', filteredMessages);
            
            return filteredMessages
                .map((msg: any) => ({
                    id: msg.id,
                    content: msg.decryptedContent || msg.content || '[Failed to decrypt]',
                    created_at: msg.created_at,
                    pubkey: msg.actualSenderPubkey || msg.pubkey, // Use actual sender pubkey from seal event
                    isFromMe: (msg.actualSenderPubkey || msg.pubkey) === publicKey,
                    timestamp: new Date(msg.created_at * 1000),
                }))
                .sort((a: any, b: any) => a.created_at - b.created_at);
        }
        return [];
    }, [messagesData, type, publicKey, receiverPublicKey]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [processedMessages]);

    const handleSendMessage = async () => {
        if (!message.trim() || !receiverPublicKey || !publicKey || !privateKey) return;

        setIsProcessingMessage(true);
        try {
            await sendMessage(
                {
                    receiverPublicKey: receiverPublicKey,
                    message: message,
                },
                {
                    onSuccess: () => {
                        setMessage('');
                        showToast({ message: 'Message sent', type: 'success' });
                        refetchMessages();
                    },
                    onError() {
                        showToast({ message: 'Error sending message', type: 'error' });
                    },
                },
            );
        } catch (error) {
            console.error('Error sending message:', error);
            showToast({ message: 'Error sending message', type: 'error' });
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

    if (isLoadingMessages) {
        return (
            <div className="flex items-center justify-center h-64">
                <CryptoLoading />
                <span className="ml-2">Loading messages...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center p-4 border-b ">
                <button
                    onClick={handleGoBack}
                    className="mr-3 p-2 hover:bg-gray-100 rounded-full"
                >
                    <Icon name="BackIcon" size={20} />
                </button>
                <div className="flex items-center flex-1">
                    <div className="w-10 h-10 rounded-full  mr-3 flex-shrink-0">
                        {receiverProfile?.picture && (
                            <Image
                                src={receiverProfile.picture}
                                alt="Profile"
                                width={40}
                                height={40}
                                className="rounded-full"
                            />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">
                            {receiverProfile?.display_name || receiverProfile?.name || receiverPublicKey?.slice(0, 8) || 'Unknown'}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                            {receiverPublicKey}
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {processedMessages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        <div>No messages yet. Start the conversation!</div>
                        {/* Debug: Show raw message data */}
                        <div className="mt-4 text-xs text-gray-400">
                            <div>Debug Info:</div>
                            <div>Messages data: {JSON.stringify(messagesData)}</div>
                            <div>All messages length: {messagesData?.pages?.flat().length || 0}</div>
                            <div>Public key: {publicKey}</div>
                            <div>Receiver public key: {receiverPublicKey}</div>
                        </div>
                    </div>
                ) : (
                    processedMessages.map((msg: any) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.isFromMe ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                    msg.isFromMe
                                        ? 'justify-start bg-gray-500'
                                        : 'justify-end bg-gray-500'
                                }`}
                            >
                                <p className="text-sm">{msg.content}</p>
                                <p className={`text-xs mt-1 ${
                                    msg.isFromMe ? 'text-gray-500' : 'text-gray-500'
                                }`}>
                                    {formatDistanceToNow(msg.timestamp, { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
                <div className="flex items-center space-x-2">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
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