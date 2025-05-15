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
import { WalletConnectButton } from '../WalletConnectButton';
interface CustomHeaderInterface {
    title?: string;
    showLogo?: boolean;
    isModalMode?: boolean;
}


export const ProfileManagement = ({ title, showLogo, isModalMode }: CustomHeaderInterface) => {
    // const isDesktop = React.useMemo(() => {
    //     return dimensions.width >= 1024;
    // }, [dimensions]);

    const { publicKey, setAuth } = useAuth();
    const [isOpenProfile, setIsOpenProfile] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<'all' | 'nostr' | 'onchain'>('all');
    const nostrAccounts = NostrKeyManager.getAllNostrAccountsFromStorage();
    const [isWalletSelectOpen, setIsWalletSelectOpen] = React.useState(false);
    const { showToast } = useUIStore();
    const handleIsOpenProfile = () => {
        setIsOpenProfile(!isOpenProfile);
    };


    const nostrProfiles = useMemo(() => {
        if (!nostrAccounts) return [];
        const users: any[] = [];
        for (const [key, value] of Object.entries(nostrAccounts)) {
            users.push(value);
        }
        return users;
    }, [nostrAccounts]);

    const handleConnectWallet = (item: any) => {
        setIsWalletSelectOpen(!isWalletSelectOpen);
        setAuth(item?.publicKey, item?.secretKey);
        NostrKeyManager.setAccountConnected(item);
        showToast({
            message: `Wallet connected: ${item?.publicKey}`,
            description: "You are now connected to the wallet",
            type: "success"
        })
        // handleIsOpenProfile();

    }

    return (
        <div style={{
            width: '100%',
            padding: 8,
        }}>


            <div className="card shadow p-4">

                <NostrProfileManagement></NostrProfileManagement>
            </div>

            <div className='card shadow'>
                <p>Onchain wallet</p>

                <div>
                    <p>Starknet account</p>
                    <WalletConnectButton></WalletConnectButton>
                </div>
            </div>

        </div>
    );
};
