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

    // Use NIP-17 messages hook for fetching messages between users
    const { 
        data: messagesData, 
        isLoading: isLoadingMessages,
        refetch: refetchMessages 
    } = useNip17MessagesBetweenUsers(receiverPublicKey, {
        enabled: type === "NIP17" && !!publicKey && !!privateKey && !!receiverPublicKey,
    });

    // Process messages for NIP-17
    const processedMessages = useMemo(() => {
        if (type === "NIP17" && messagesData?.pages) {
            const allMessages = messagesData.pages.flat();
            return allMessages
                .filter((msg: any) => msg && msg.decryptedContent) // Only include successfully decrypted messages
                .map((msg: any) => ({
                    id: msg.id,
                    content: msg.decryptedContent,
                    created_at: msg.created_at,
                    pubkey: msg.actualSenderPubkey || msg.pubkey, // Use actual sender pubkey from seal event
                    isFromMe: (msg.actualSenderPubkey || msg.pubkey) === publicKey,
                    timestamp: new Date(msg.created_at * 1000),
                }))
                .sort((a: any, b: any) => a.created_at - b.created_at);
        }
        return [];
    }, [messagesData, type, publicKey]);

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
            <div className="flex items-center p-4 border-b bg-white">
                <button
                    onClick={handleGoBack}
                    className="mr-3 p-2 hover:bg-gray-100 rounded-full"
                >
                    <Icon name="BackIcon" size={20} />
                </button>
                <div className="flex items-center flex-1">
                    <div className="w-10 h-10 rounded-full bg-gray-200 mr-3 flex-shrink-0">
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
                        No messages yet. Start the conversation!
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
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 text-gray-900'
                                }`}
                            >
                                <p className="text-sm">{msg.content}</p>
                                <p className={`text-xs mt-1 ${
                                    msg.isFromMe ? 'text-blue-100' : 'text-gray-500'
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
            <div className="p-4 border-t bg-white">
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