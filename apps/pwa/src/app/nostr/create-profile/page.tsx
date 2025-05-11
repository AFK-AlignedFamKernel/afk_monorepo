'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNostrContext, settingsStore, authStore, NostrKeyManager } from 'afk_nostr_sdk';
import { generateRandomKeypair } from '../../../../../../packages/afk_nostr_sdk/src/utils/keypair';
import * as bip39 from 'bip39';
import { useUIStore } from '@/store/uiStore';
import LoginNostrComponent from '@/components/Nostr/login/LoginNostrComponent';
import { ProfileManagement } from '@/components/Nostr/profile/profile-management';
import NostrCreateAccountComponent from '@/components/Nostr/login/NostrCreateAccount';
export default function NostrCreateProfile() {
    const [error, setError] = useState('');

    const [type, setType] = useState<'login' | 'register'>('login');

    return (
        <div className="">

            <NostrCreateAccountComponent />
        </div>
    );
}
