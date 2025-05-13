// apps/pwa/src/components/Nostr/Messages/ChatConversation.tsx
// 'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useAuth, useIncomingMessageUsers, useMyMessagesSent, useProfile, useRoomMessages } from 'afk_nostr_sdk';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import { NDKUser } from '@nostr-dev-kit/ndk';
import { useSendPrivateMessage } from 'afk_nostr_sdk';
import { useQueryClient } from '@tanstack/react-query';
import CryptoLoading from '@/components/small/crypto-loading';
interface ChatProps {
    item: any;
    publicKeyProps: string;
    receiverPublicKey: string;
    handleGoBack: () => void;
    messagesSentParents: any[];
}

export const ChatConversation: React.FC<ChatProps> = ({
    item,
    handleGoBack,
    messagesSentParents,
    publicKeyProps,
    receiverPublicKey,
}) => {
    const { data: profile } = useProfile(item.senderPublicKey);
    const [message, setMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const { publicKey } = useAuth();
    const { mutateAsync: sendMessage } = useSendPrivateMessage();
    const queryClient = useQueryClient();

    const roomIds = useMemo(() => [publicKey, receiverPublicKey], [publicKey, receiverPublicKey]);

    const { data: messagesSent, isLoading: isLoadingSent, isFetching: isFetchingSent, isFetched } = useMyMessagesSent({
        authors: roomIds,
        limit: 100,
    });

    const { data: incomingMessages, isLoading: isLoadingIncoming, isFetched: isFetchedIncoming } = useIncomingMessageUsers({
        authors: roomIds,
        limit: 100,
    });

    const allMessages = useMemo(() => {
        const sent = messagesSent?.pages.flat() || [];
        const received = incomingMessages?.pages.flat() || [];
        return [...sent, ...received].sort((a, b) => a.created_at - b.created_at);
    }, [messagesSent?.pages, incomingMessages?.pages]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [allMessages]);

    const handleSendMessage = useCallback(() => {
        if (!message.trim()) return;

        sendMessage(
            {
                content: message,
                receiverPublicKeyProps: receiverPublicKey,
            },
            {
                onSuccess: () => {
                    setMessage('');
                    queryClient.invalidateQueries({ queryKey: ['myMessagesSent'] });
                    queryClient.invalidateQueries({ queryKey: ['messageUsers'] });
                },
                onError: (error) => {
                    console.error('Error sending message:', error);
                },
            }
        );
    }, [message, receiverPublicKey, sendMessage, queryClient]);

    if (isLoadingSent || isLoadingIncoming) {
        return (
            <div className="flex items-center justify-center h-full">
                <p>Loading messages...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center p-4 border-b">
                <button
                    onClick={() => {
                        handleGoBack();
                        setMessage('');
                        // setMess
                    }}
                    className="p-2 hover:bg-gray-100 rounded"
                >
                    ←
                </button>
                <div className="flex items-center ml-2">
                    {profile?.image ? (
                        <Image
                            src={profile.image}
                            width={32}
                            height={32}
                            alt={profile?.name || item.senderPublicKey.slice(0, 8)}
                            className="rounded-full"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200" />
                    )}
                    <div className="ml-2">
                        <p className="font-medium">
                            {profile?.name || item.senderPublicKey.slice(0, 8)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">

                    {isFetchingSent && isFetchedIncoming ? <CryptoLoading></CryptoLoading>
                        : allMessages.map((msg: any) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.senderPublicKey === publicKey ? 'justify-end' : 'justify-start'
                                    }`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-lg p-3 ${msg.senderPublicKey === publicKey
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100'
                                        }`}
                                >
                                    <p className="text-sm">{msg.content}</p>
                                    <span className="text-xs opacity-70">
                                        {/* {formatDistanceToNow(new Date(msg?.created_at * 1000), { addSuffix: true })} */}
                                    </span>
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
                <div className="flex space-x-2">
                    <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 p-2 border rounded"
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button
                        onClick={handleSendMessage}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};