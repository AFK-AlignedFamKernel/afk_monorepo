'use client';

import { useState } from 'react';
import { NostrMessagesComponent } from "@/components/Nostr/Messages/nip17";
import { NostrMessagesComponentNip4 } from "@/components/Nostr/Messages/nip4";
import { RelayAuthInitializer } from '@/components/Nostr/relay/RelayAuthInitializer';

export default function MessagesNostrOverview() {
    const [activeType, setActiveType] = useState<'NIP4' | 'NIP17'>('NIP17');

    return (
        <div className="h-full">
            <RelayAuthInitializer showStatus={false}>
                {/* <div className="flex border-b">
                    <button
                        className={`flex-1 py-2 px-4 ${activeType === 'NIP17' ? 'border-b-2 border-blue-500' : ''}`}
                        onClick={() => setActiveType('NIP17')}
                    >
                        NIP-17 Messages
                    </button>
                    <button
                        className={`flex-1 py-2 px-4 ${activeType === 'NIP4' ? 'border-b-2 border-blue-500' : ''}`}
                        onClick={() => setActiveType('NIP4')}
                    >
                        NIP-04 Messages
                    </button>

                </div> */}

                {activeType === 'NIP4' ? (
                    <NostrMessagesComponentNip4 />
                ) : (
                    <NostrMessagesComponent />
                )}
            </RelayAuthInitializer>
        </div>
    )
}