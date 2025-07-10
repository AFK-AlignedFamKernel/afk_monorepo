'use client';

import * as React from 'react';
import Image from 'next/image';
import { useCallback, useMemo } from 'react';

import { NostrKeyManager, useAuth } from 'afk_nostr_sdk';
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import { Avatar } from '@chakra-ui/react';
import { useUIStore } from '@/store/uiStore';
import { Icon } from '@/components/small/icon-component';
import { NostrProfileManagement } from '../Nostr/profile/nostr-profile-management';
import { WalletConnectButton } from '../account/WalletConnectButton';
import { Oauth } from './Oauth';
import Divider from '../small/Divider';
import Accordion from '../small/accordion';
import AccordionMenu from '../small/AccordionMenu';
interface CustomHeaderInterface {
    title?: string;
    showLogo?: boolean;
    isModalMode?: boolean;
}


export const ProfileManagement = ({ title, showLogo, isModalMode }: CustomHeaderInterface) => {
    const { publicKey, setAuth } = useAuth();
    const [activeTab, setActiveTab] = React.useState<'nostr' | 'onchain' | 'oauth'>('nostr');
    const { showToast } = useUIStore();

    return (
        <div className="w-full max-w-md mx-auto p-4">
            <div className="flex justify-center gap-2 mb-4">
                <button
                    className={`px-4 py-2 rounded font-semibold transition-colors focus:outline-none ${activeTab === 'nostr' ? 'bg-blue-700 text-white shadow' : 'bg-[var(--card-bg)] dark:bg-[var(--card-bg)] text-gray-700 dark:text-gray-200 border border-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900'}`}
                    onClick={() => setActiveTab('nostr')}
                    aria-label="Show Nostr profile section"
                >
                    Nostr
                </button>
                <button
                    className={`px-4 py-2 rounded font-semibold transition-colors focus:outline-none ${activeTab === 'onchain' ? 'bg-blue-700 text-white shadow' : 'bg-[var(--card-bg)] dark:bg-[var(--card-bg)] text-gray-700 dark:text-gray-200 border border-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900'}`}
                    onClick={() => setActiveTab('onchain')}
                    aria-label="Show Onchain wallet section"
                >
                    Onchain
                </button>
                <button
                    className={`px-4 py-2 rounded font-semibold transition-colors focus:outline-none ${activeTab === 'oauth' ? 'bg-blue-700 text-white shadow' : 'bg-[var(--card-bg)] dark:bg-[var(--card-bg)] text-gray-700 dark:text-gray-200 border border-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900'}`}
                    onClick={() => setActiveTab('oauth')}
                    aria-label="Show OAuth section"
                >
                    OAuth
                </button>
            </div>

            {activeTab === 'nostr' && (
                <div className="card shadow rounded p-4 mb-4">
                    <h2 className="text-lg font-bold mb-2">Nostr Profile</h2>
                    <NostrProfileManagement />
                </div>
            )}

            {activeTab === 'onchain' && (
                <div className="card shadow rounded p-4 mb-4">
                    <h2 className="text-lg font-bold mb-2">Onchain Wallet</h2>
                    <WalletConnectButton />
                </div>
            )}

            {activeTab === 'oauth' && (
                <div className="card shadow rounded p-4 mb-4">
                    <h2 className="text-lg font-bold mb-2">OAuth Accounts</h2>
                    <Oauth />
                </div>
            )}
        </div>
    );
};
