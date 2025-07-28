// apps/pwa/src/components/Nostr/Messages/ChatConversation.tsx
// 'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { useAuth, useSendPrivateMessage, useProfile, useNostrContext, useRelayAuthInit, useNip17MessagesBetweenUsers } from 'afk_nostr_sdk';
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
    messagesSentParents: any[];
    type?: "NIP4" | "NIP17";
}

export const ChatConversation: React.FC<ChatProps> = ({
    item,
    handleGoBack,
    messagesSentParents,
    publicKeyProps,
    receiverPublicKey,
    type
}) => {
    const { data: profile } = useProfile(item.senderPublicKey);
    const [message, setMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const { publicKey, privateKey } = useAuth();
    const { mutateAsync: sendMessage } = useSendPrivateMessage();

    const queryClient = useQueryClient();
    const { showToast } = useUIStore();
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const { ndk } = useNostrContext();
    
    // Use the new relay auth initialization
    const { isAuthenticated, isInitializing, hasError, errorMessage, initializeAuth } = useRelayAuthInit();
    
    // Use NIP-17 hooks for messages between users
    const { 
        data: messagesBetweenUsers, 
        isLoading: isLoadingMessages,
        refetch: refetchMessages 
    } = useNip17MessagesBetweenUsers(receiverPublicKey, {
        enabled: type === "NIP17" && !!publicKey && !!privateKey && !!receiverPublicKey,
    });

    // Process and decrypt NIP-17 messages
    const processedMessages = useMemo(() => {
        if (!messagesBetweenUsers?.pages) return [];
        
        const allMessages = messagesBetweenUsers.pages.flat();
        
        // Process messages synchronously for now
        return allMessages.map((event: any) => {
            let decryptedContent = '';
            try {
                // For NIP-17, we need to decrypt the content
                const peerPubkey = event.pubkey === publicKey ? receiverPublicKey : event.pubkey;
                // Note: This is a simplified version - in a real implementation you'd want to handle async decryption properly
                decryptedContent = '[Encrypted message]'; // Placeholder for decryption
            } catch (e) {
                decryptedContent = '[Unable to decrypt]';
            }
            
            return {
                ...event,
                senderPublicKey: event.pubkey,
                receiverPublicKey: event.pubkey === publicKey ? receiverPublicKey : publicKey,
                content: decryptedContent,
                type: "NIP17"
            };
        });
    }, [messagesBetweenUsers?.pages, publicKey, receiverPublicKey]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [processedMessages]);

    const handleSendMessage = async () => {
        if (!message.trim() || !receiverPublicKey) return;
        
        setIsSendingMessage(true);
        try {
            await sendMessage(
                {
                    content: message,
                    receiverPublicKeyProps: receiverPublicKey,
                },
                {
                    onSuccess: () => {
                        setMessage('');
                        refetchMessages();
                        showToast({ message: 'Message sent', type: 'success' });
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
            setIsSendingMessage(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!publicKey || !receiverPublicKey) {
        return (
            <div className="flex flex-col items-center justify-center p-4 space-y-4">
                <h2 className="text-xl font-semibold">Invalid conversation</h2>
                <p className="text-gray-600">Unable to load conversation</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center p-4 border-b">
                <button
                    onClick={handleGoBack}
                    className="mr-3 p-2 hover:bg-gray-100 rounded"
                >
                    <Icon name="BackIcon" size={20} />
                </button>
                <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 mr-3" />
                    <div>
                        <p className="font-medium">
                            {receiverPublicKey?.slice(0, 8) || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500">
                            {profile?.name || 'Nostr User'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
            >
                {isLoadingMessages && (
                    <div className="flex items-center justify-center py-4">
                        <CryptoLoading />
                        <span className="ml-2 text-gray-600">Loading messages...</span>
                    </div>
                )}
                
                {processedMessages?.map((msg: any) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.senderPublicKey === publicKey ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                msg.senderPublicKey === publicKey
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-900'
                            }`}
                        >
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-xs mt-1 ${
                                msg.senderPublicKey === publicKey ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                                {formatDistanceToNow(new Date(msg.created_at * 1000), { addSuffix: true })}
                            </p>
                        </div>
                    </div>
                ))}
                
                {processedMessages?.length === 0 && !isLoadingMessages && (
                    <div className="flex items-center justify-center py-8">
                        <p className="text-gray-500">No messages yet</p>
                    </div>
                )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isSendingMessage}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || isSendingMessage}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSendingMessage ? <CryptoLoading /> : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};