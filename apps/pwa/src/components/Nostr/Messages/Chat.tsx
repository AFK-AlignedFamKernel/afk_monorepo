// apps/pwa/src/components/Nostr/Messages/Chat.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useProfile } from 'afk_nostr_sdk';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { Icon } from '@/components/small/icon-component';

interface ChatProps {
    item: any;
    handleGoBack: () => void;
    messagesSentParents: any[];
}

export const Chat: React.FC<ChatProps> = ({
    item,
    handleGoBack,
    messagesSentParents,
}) => {
    const { data: profile } = useProfile(item.senderPublicKey);
    const [message, setMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messagesSentParents]);

    const handleSendMessage = async () => {
        if (!message.trim()) return;
        // Implement your message sending logic here
        setMessage('');
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center p-4 border-b">
                <button onClick={handleGoBack}>
                </button>
                <div className="ml-2">

                    {profile?.image && (
                        <Image
                            unoptimized
                            src={profile?.image || ''} width={24} height={24} alt={profile?.name || item.senderPublicKey.slice(0, 8)} />
                    )}
                 
                    <p>
                        {profile?.name?.charAt(0) || item.senderPublicKey.slice(0, 2)}
                    </p>
                </div>
                <div className="ml-2">
                    <p className="font-medium">
                        {profile?.name || item.senderPublicKey.slice(0, 8)}
                    </p>
                </div>
            </div>

            <div ref={scrollRef} className="flex-1 p-4">
                <div className="space-y-4">
                    {messagesSentParents.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.senderPublicKey === item.senderPublicKey ? 'justify-start' : 'justify-end'
                                }`}
                        >
                            <div
                                className={`max-w-[70%] rounded-lg p-3 ${msg.senderPublicKey === item.senderPublicKey
                                    ? 'bg-gray-100'
                                    : 'bg-primary text-primary-foreground'
                                    }`}
                            >
                                <p className="text-sm">{msg.content}</p>
                                <span className="text-xs opacity-70">
                                    {formatDistanceToNow(new Date(msg.created_at * 1000), { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-4 border-t">
                <div className="flex space-x-2">
                    <input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button onClick={handleSendMessage}>
                        <Icon name="SendIcon" className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};