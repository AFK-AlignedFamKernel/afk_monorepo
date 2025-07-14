// apps/pwa/src/components/Nostr/Messages/ChatConversation.tsx
// 'use client';

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
// importuseMyMessagesSent, useAuth, useProfile,  { NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
// import { NDKUser } from '@nostr-dev-kit/ndk';
import { useAuth, useSendPrivateMessage, useProfile, useMyMessagesSent, useIncomingMessageUsers, useNostrContext, checkIsConnected, useEncryptedMessage } from 'afk_nostr_sdk';
import { useQueryClient } from '@tanstack/react-query';
import CryptoLoading from '@/components/small/crypto-loading';
import { logClickedEvent } from '@/lib/analytics';
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
    const { data: profile } = useProfile(item.senderPublicKey);
    const [message, setMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const { publicKey, privateKey, isNostrAuthed } = useAuth();
    const { mutateAsync: sendMessage } = useSendPrivateMessage();
    const { mutateAsync: sendEncryptedMessageNip4 } = useEncryptedMessage();

    const queryClient = useQueryClient();
    const { showToast } = useUIStore();
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const { ndk } = useNostrContext();
    // Use the old hooks for fetching conversation messages
    const roomIds = useMemo(() => [publicKey, receiverPublicKey], [publicKey, receiverPublicKey]);
    const { data: messagesSent, isLoading: isLoadingSent } = useMyMessagesSent({
        authors: roomIds,
    });
    const { data: incomingMessages, isLoading: isLoadingIncoming } = useIncomingMessageUsers({
        authors: roomIds,
    });

    const [allMessagesState, setAllMessagesState] = useState<any[]>([]);

    // Combine all NIP4 messages between the two parties
    const allMessagesNip4 = useMemo(() => {
        // Remove duplicates by event id
        const unique = new Map();
        allMessagesState.forEach((msg: any) => {
            if (
                msg.type === "NIP4" &&
                (
                    (msg.senderPublicKey === publicKey && msg.tags?.some((t: any) => t[0] === 'p' && t[1] === receiverPublicKey)) ||
                    (msg.senderPublicKey === receiverPublicKey && msg.tags?.some((t: any) => t[0] === 'p' && t[1] === publicKey))
                )
            ) {
                unique.set(msg.id, msg);
            }
            else {
                unique.set(msg.id, msg);
            }
        });
        // Sort by created_at
        return Array.from(unique.values()).sort((a, b) => a.created_at - b.created_at);
    
    }, [allMessagesState, publicKey, receiverPublicKey]);

    const allMessagesNip17 = useMemo(() => {
        return allMessagesState.filter((msg: any) => msg.type === "NIP17");
    }, [allMessagesState]);
    useEffect(() => {

        if(isNostrAuthed){
            console.log("isNostrAuthed", isNostrAuthed);
            fetchAllMessages();
            fetchAllMessagesSubscription();
        }
    }, [publicKey, receiverPublicKey, isNostrAuthed]);
    // Combine and sort messages
    const allMessages = useMemo(() => {
        const sent = messagesSent?.pages?.flat() || [];
        const received = incomingMessages?.pages?.flat() || [];


        return [...sent, ...received]
            .filter(Boolean)
            .filter((a) => a?.pubkey === publicKey || a?.pubkey === receiverPublicKey)
            .sort((a, b) => a.created_at - b.created_at);
    }, [messagesSent?.pages, incomingMessages?.pages]);

    const fetchAllMessages = async () => {

        console.log("fetchAllMessages", publicKey, receiverPublicKey);
        try {
            await checkIsConnected(ndk);

            if (!publicKey || !receiverPublicKey) {
                return;
            }
            

            const events = await ndk.fetchEvents(
                [
                    {
                        kinds: [4 as NDKKind],
                        authors: [publicKey],
                        '#p': [receiverPublicKey],
                        limit: 10,

                    },
                    {
                        kinds: [4 as NDKKind],
                        authors: [receiverPublicKey],
                        '#p': [publicKey],
                        limit: 10,
                    }
                ]
            )
            console.log("fetchAllMessages events", events);
        } catch (error) {
            console.error("Error fetching events:", error);
        }
    }


    const fetchAllMessagesSubscription = async () => {
        if (!publicKey || !receiverPublicKey) {
            return;
        }
        console.log("fetchAllMessagesSubscription", publicKey, receiverPublicKey);
        try {
            await checkIsConnected(ndk);
            console.log("subscriptionEvent");
            const subscription = ndk.subscribe({
                kinds: [4 as NDKKind],
                authors: [publicKey],
                '#p': [receiverPublicKey],
                limit: 20,
            });

            subscription.on("event:dup", (event) => {
                console.log("event sent dup", event);

                if (!privateKey) {
                    return;
                }
                (async () => {
                    let decryptedContent = '';

                    if (!privateKey) {
                        return;
                    }
                    try {
                        // event.pubkey is the sender, publicKey is the receiver (us)
                        // If we are the sender, decrypt with our private key and receiver's pubkey
                        // If we are the receiver, decrypt with our private key and sender's pubkey
                        let peerPubkey = event.pubkey === publicKey ? receiverPublicKey : event.pubkey;
                        decryptedContent = await nip04.decrypt(privateKey, peerPubkey, event.content);
                        console.log("decryptedContent", decryptedContent);
                    } catch (e) {
                        decryptedContent = '[Unable to decrypt]';
                    }
                    setAllMessagesState((prev: any) => [
                        ...prev,
                        { ...event, senderPublicKey: event.pubkey, type: "NIP4", content: decryptedContent }
                    ]);
                })();
                // setAllMessagesState((prev: any) => [...prev, { ...event, senderPublicKey: event.pubkey, type: "NIP4" }]);
            });


            subscription.on("event", (event) => {
                console.log("event sent", event);

                // Decrypt NIP4 message content

                (async () => {
                    let decryptedContent = '';

                    if (!privateKey) {
                        return;
                    }
                    try {
                        // event.pubkey is the sender, publicKey is the receiver (us)
                        // If we are the sender, decrypt with our private key and receiver's pubkey
                        // If we are the receiver, decrypt with our private key and sender's pubkey
                        let peerPubkey = event.pubkey === publicKey ? receiverPublicKey : event.pubkey;
                        decryptedContent = await nip04.decrypt(privateKey, peerPubkey, event.content);
                    } catch (e) {
                        decryptedContent = '[Unable to decrypt]';
                    }
                    setAllMessagesState((prev: any) => [
                        ...prev,
                        { ...event, senderPublicKey: event.pubkey, type: "NIP4", content: decryptedContent }
                    ]);
                })();
            });


            const subscriptionReceived = ndk.subscribe({
                kinds: [4 as NDKKind],
                '#p': [publicKey],
                limit: 10,
            });

            subscriptionReceived.on("event", (event) => {
                console.log("event received", event);
                if (!privateKey) {
                    return;
                }

                // if(event?.pubkey != publicKey){
                //     return;
                // }
                (async () => {
                    let decryptedContent = '';
                    try {
                        // event.pubkey is the sender, publicKey is the receiver (us)
                        // If we are the sender, decrypt with our private key and receiver's pubkey
                        // If we are the receiver, decrypt with our private key and sender's pubkey
                        let peerPubkey = event.pubkey === publicKey ? receiverPublicKey : event.pubkey;
                        decryptedContent = await nip04.decrypt(privateKey, peerPubkey, event.content);
                    } catch (e) {
                        decryptedContent = '[Unable to decrypt]';
                    }
                    setAllMessagesState((prev: any) => [...prev, { ...event, senderPublicKey: event.pubkey, type: "NIP4", content: decryptedContent }]);
                })();
            });

            subscriptionReceived.on("event:dup", (event) => {
                console.log("event received dup", event);
                if (!privateKey) {
                    return;
                }
                (async () => {
                    let decryptedContent = '';
                    try {
                        // event.pubkey is the sender, publicKey is the receiver (us)
                        // If we are the sender, decrypt with our private key and receiver's pubkey
                        // If we are the receiver, decrypt with our private key and sender's pubkey
                        let peerPubkey = event.pubkey === publicKey ? receiverPublicKey : event.pubkey;
                        decryptedContent = await nip04.decrypt(privateKey, peerPubkey, event.content);
                    } catch (e) {
                        decryptedContent = '[Unable to decrypt]';
                    }
                    setAllMessagesState((prev: any) => [...prev, { ...event, senderPublicKey: event.pubkey, type: "NIP4", content: decryptedContent }]);
                })();
            });
            console.log("fetchAllMessagesSubscription events", allMessagesState);
        } catch (error) {
            console.error("Error fetching events:", error);
        }
    }
    useEffect(() => {
        // console.log("item", item);

        if (type === "NIP4") {
            fetchAllMessages();
            fetchAllMessagesSubscription();
        }
    }, [item]);

    // Guard: Only proceed if both keys are valid
    if (!publicKey || !receiverPublicKey) {
        return <div className="flex items-center justify-center h-full">No conversation selected.</div>;
    }

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [allMessages]);
    // console.log("allMessagesState", allMessagesState);

    const handleSendMessage = useCallback(() => {

        try {
            setIsSendingMessage(true);
            if (!message.trim()) {
                showToast({ message: 'Please enter a message', type: 'error' });
                return;
            }
            // let receiverPublicKey = roomIds.find((id) => id !== publicKey);

            console.log("receiverPublicKey", receiverPublicKey);
            // TODO auto saved message
            // if (roomIds[0] === roomIds[1]) {
            //     receiverPublicKey = roomIds[0] ?? publicKey;
            // }
            if (!receiverPublicKey && roomIds.length > 1 && roomIds[0] != roomIds[1]) {
                showToast({ message: 'Invalid receiver', type: 'error' });
                return;
            }

            if (!receiverPublicKey) {
                showToast({ message: 'Invalid receiver', type: 'error' });
                return;
            }

            if (type === "NIP4") {
                console.log("nip4 message", message);
                sendEncryptedMessageNip4({
                    content: message,
                    receiverPublicKey: receiverPublicKey,
                    // subject: "test",
                })
            } else {
                console.log("nip17 message", message);

                sendMessage(
                    {
                        content: message,
                        receiverPublicKeyProps: receiverPublicKey,
                    },
                    {
                        onSuccess: () => {
                            setMessage('');
                            showToast({ message: 'Message sent', type: 'success' });
                            queryClient.invalidateQueries({ queryKey: ['myMessagesSent'] });
                            queryClient.invalidateQueries({ queryKey: ['messageUsers'] });
                        },
                        onError: (error) => {
                            console.error('Error sending message:', error);
                            showToast({ message: 'Error sending message', type: 'error' });
                        },
                    }
                );

            }

            showToast({ message: 'Message sent', type: 'success' });

            setIsSendingMessage(false);
        } catch (error) {
            setIsSendingMessage(false);
        }
        finally {
            setIsSendingMessage(false);
        }
    }, [message, receiverPublicKey, sendMessage, queryClient]);

    // if (isLoadingSent || isLoadingIncoming) {
    //     return (
    //         <div className="flex items-center justify-center h-full">
    //             <p>Loading messages...</p>
    //         </div>
    //     );
    // }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center p-4 border-b">
                <button
                    onClick={() => {
                        handleGoBack();
                        logClickedEvent('go_conversation_nip17', 'messages_data');
                        setMessage('');
                    }}
                    className="p-2 rounded"
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
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4  max-h-[350px] lg:max-h-[500px]">

                <div>

                    {allMessagesNip4.map((msg: any) => {
                        const isSent = msg.pubkey === publicKey;
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-2`}
                            >
                                <div
                                    className={`
                                        max-w-[70%]
                                        rounded-lg
                                        px-4 py-2
                                        text-sm
                                        shadow
                                        ${isSent
                                            ? 'bg-blue-500 text-white rounded-br-none'
                                            : 'bg-neutral-100 dark:bg-neutral-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
                                        }
                                    `}
                                    style={{
                                        wordBreak: 'break-word',
                                        borderTopRightRadius: isSent ? 0 : undefined,
                                        borderTopLeftRadius: !isSent ? 0 : undefined,
                                    }}
                                >
                                    <p>{msg.content}</p>
                                    <span className="block text-xs opacity-60 mt-1 text-right">
                                        {msg.created_at
                                            ? formatDistanceToNow(new Date(msg.created_at * 1000), { addSuffix: true })
                                            : ''}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="space-y-4">
                    {/* {allMessages.length === 0 ? (
                        <div className="text-center text-gray-400">No messages yet.</div>
                    ) : (
                        allMessages.map((msg: any) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.senderPublicKey === publicKey ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-lg p-3 ${msg.senderPublicKey === publicKey
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100'
                                        }`}
                                >
                                    <p className="text-sm">{msg.decryptedContent || msg.content}</p>
                                    <span className="text-xs opacity-70">
                                        {formatDistanceToNow(new Date(msg?.created_at * 1000), { addSuffix: true })}
                                    </span>
                                </div>
                            </div>
                        ))
                    )} */}
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
                    // onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button
                        disabled={isSendingMessage}
                        onClick={() => {
                            handleSendMessage();
                            logClickedEvent(`send_message_${type}`, 'messages_data');
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};