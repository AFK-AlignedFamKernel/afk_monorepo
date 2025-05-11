'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNostrContext, settingsStore, authStore, NostrKeyManager } from 'afk_nostr_sdk';
import { generateRandomKeypair } from '../../../../../../packages/afk_nostr_sdk/src/utils/keypair';
import * as bip39 from 'bip39';
import { useUIStore } from '@/store/uiStore';
import LoginNostrComponent from '@/components/Nostr/login/LoginNostrComponent';
export default function NostrLoginPage() {
    const [error, setError] = useState('');


    return (
        <div className="">
            <LoginNostrComponent />
            
        </div>
    );
}
