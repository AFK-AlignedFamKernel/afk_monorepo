'use client';

import { useState } from 'react';
import { NostrMessagesComponent } from "@/components/Nostr/Messages/nip17";
import { NostrMessagesComponentNip4 } from "@/components/Nostr/Messages/nip4";
import { RelayAuthInitializer } from '@/components/Nostr/relay/RelayAuthInitializer';

export default function MessagesNostrOverview() {
    const [activeType, setActiveType] = useState<'NIP4' | 'NIP17'>('NIP17');

    return (
        <div className="h-full">

            <div className="justify-center items-center h-full p-4">
                <p className="text-lg">This feature is still in development. Use at your own risk.</p>
                <p className="text-sm italic text-gray-500">Please report any issues you encounter.</p>
            </div>
            {activeType === 'NIP17' && (
                <NostrMessagesComponent />
            )}

            <RelayAuthInitializer showStatus={false}>

                {activeType === 'NIP4' && (
                    <NostrMessagesComponentNip4 />
                )}
            </RelayAuthInitializer>
        </div>
    )
}