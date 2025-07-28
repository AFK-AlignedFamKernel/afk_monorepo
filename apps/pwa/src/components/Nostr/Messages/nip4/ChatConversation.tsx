'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth, useEncryptedMessage, useNostrContext, checkIsConnected } from 'afk_nostr_sdk';
import { useQueryClient } from '@tanstack/react-query';
import { useUIStore } from '@/store/uiStore';
import { NDKKind } from '@nostr-dev-kit/ndk';
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
    const [message, setMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const { publicKey, privateKey, isNostrAuthed } = useAuth();
    const { mutateAsync: sendEncryptedMessageNip4 } = useEncryptedMessage();
    const queryClient = useQueryClient();
    const { showToast } = useUIStore();
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const { ndk } = useNostrContext();
    const [allMessagesState, setAllMessagesState] = useState<any[]>([]);

    // Combine all NIP4 messages between the two parties
    const allMessagesNip4 = useMemo(() => {
        // Remove duplicates by event id
        const unique = new Map();
        allMessagesState.forEach((msg: any) => {
            // Only include messages where (sender, receiver) matches (publicKey, receiverPublicKey) or (receiverPublicKey, publicKey)
            const isBetweenUsers =
                (msg.pubkey === publicKey && msg.tags?.some((t: any) => t[0] === 'p' && t[1] === receiverPublicKey)) ||
                (msg.pubkey === receiverPublicKey && msg.tags?.some((t: any) => t[0] === 'p' && t[1] === publicKey));
            if (msg.type === "NIP4" && isBetweenUsers) {
                unique.set(msg.id, msg);
            }
        });
        // Sort by created_at
        return Array.from(unique.values()).sort((a, b) => a.created_at - b.created_at);
    }, [allMessagesState, publicKey, receiverPublicKey]);

    const fetchAllMessages = async () => {
        if (!publicKey || !receiverPublicKey || !privateKey) {
            return;
        }
        try {
            await checkIsConnected(ndk);
            // Fetch both directions in a single call
            const events = await ndk.fetchEvents([
                {
                    kinds: [4 as NDKKind],
                    authors: [publicKey],
                    '#p': [receiverPublicKey],
                    limit: 20,
                },
                {
                    kinds: [4 as NDKKind],
                    authors: [receiverPublicKey],
                    '#p': [publicKey],
                    limit: 20,
                }
            ]);
            // Decrypt and set state
            const decryptedEvents = await Promise.all(
                Array.from(events).map(async (event: any) => {
                    let decryptedContent = '';
                    try {
                        let peerPubkey = event.pubkey === publicKey ? receiverPublicKey : event.pubkey;
                        decryptedContent = await nip04.decrypt(privateKey, peerPubkey, event.content);
                    } catch (e) {
                        decryptedContent = '[Unable to decrypt]';
                    }
                    return { ...event, senderPublicKey: event.pubkey, type: "NIP4", content: decryptedContent };
                })
            );
            setAllMessagesState(decryptedEvents);
        } catch (error) {
            console.error("Error fetching events:", error);
        }
    };

    const fetchAllMessagesSubscription = async () => {
        if (!publicKey || !receiverPublicKey || !privateKey) {
            return;
        }
        try {
            await checkIsConnected(ndk);
            // Subscribe to both directions in a single subscription
            const subscription = ndk.subscribe([
                {
                    kinds: [4 as NDKKind],
                    authors: [publicKey],
                    '#p': [receiverPublicKey],
                    limit: 20,
                },
                {
                    kinds: [4 as NDKKind],
                    authors: [receiverPublicKey],
                    '#p': [publicKey],
                    limit: 20,
                }
            ]);
            const handleEvent = async (event: any) => {
                let decryptedContent = '';
                try {
                    let peerPubkey = event.pubkey === publicKey ? receiverPublicKey : event.pubkey;
                    decryptedContent = await nip04.decrypt(privateKey, peerPubkey, event.content);
                } catch (e) {
                    decryptedContent = '[Unable to decrypt]';
                }
                setAllMessagesState((prev: any) => {
                    // Avoid duplicates
                    if (prev.some((m: any) => m.id === event.id)) return prev;
                    return [...prev, { ...event, senderPublicKey: event.pubkey, type: "NIP4", content: decryptedContent }];
                });
            };
            subscription.on("event", handleEvent);
            subscription.on("event:dup", handleEvent);
        } catch (error) {
            console.error("Error subscribing to events:", error);
        }
    };

    useEffect(() => {
        if (isNostrAuthed && publicKey && receiverPublicKey && privateKey) {
            fetchAllMessages();
            fetchAllMessagesSubscription();
        }
    }, [publicKey, receiverPublicKey, privateKey, isNostrAuthed]);

    useEffect(() => {
        // Scroll to bottom when messages change
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [allMessagesNip4]);

    const handleSendMessage = useCallback(() => {
        if (!message.trim() || isSendingMessage) return;

        setIsSendingMessage(true);
        try {
            if (type === "NIP4") {
                console.log("nip4 message", message);
                sendEncryptedMessageNip4({
                    content: message,
                    receiverPublicKey: receiverPublicKey,
                }).then(() => {
                    setMessage('');
                    showToast({ message: 'Message sent', type: 'success' });
                }).catch((error) => {
                    console.error('Error sending message:', error);
                    showToast({ message: 'Error sending message', type: 'error' });
                });
            }
        } catch (error) {
            console.error('Error sending message:', error);
            showToast({ message: 'Error sending message', type: 'error' });
        } finally {
            setIsSendingMessage(false);
        }
    }, [message, receiverPublicKey, sendEncryptedMessageNip4, showToast, type, isSendingMessage]);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <button
                    onClick={handleGoBack}
                    className="p-2 rounded hover:bg-gray-100"
                >
                    ← Back
                </button>
                <div className="flex-1 text-center">
                    <div className="font-medium">
                        {receiverPublicKey.slice(0, 8)}...{receiverPublicKey.slice(-8)}
                    </div>
                    <div className="text-sm text-gray-500">NIP-04 Chat</div>
                </div>
                <div className="w-10"></div>
            </div>

            {/* Messages */}
            <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4"
            >
                {allMessagesNip4.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                        <p>No messages yet</p>
                        <p className="text-sm">Start the conversation!</p>
                    </div>
                ) : (
                    allMessagesNip4.map((msg: any) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.pubkey === publicKey ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                    msg.pubkey === publicKey
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 text-gray-900'
                                }`}
                            >
                                <div className="text-sm">{msg.content}</div>
                                <div className={`text-xs mt-1 ${
                                    msg.pubkey === publicKey ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                    {formatDistanceToNow(new Date(msg.created_at * 1000), { addSuffix: true })}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
                <div className="flex space-x-2">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1 p-2 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={1}
                        disabled={isSendingMessage}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!message.trim() || isSendingMessage}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSendingMessage ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
}; 