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
    // const isDesktop = React.useMemo(() => {
    //     return dimensions.width >= 1024;
    // }, [dimensions]);

    const { publicKey, setAuth } = useAuth();
    const [isOpenProfile, setIsOpenProfile] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<'all' | 'nostr' | 'onchain' | 'oauth'>('all');
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
            <div style={{
                display: 'flex',
                gap: 8,
                marginBottom: 8,
            }}>
                <button className={`btn btn-secondary ${activeTab == 'all' ? 'btn-active' : ''}`} onClick={() => setActiveTab('all')}>All</button>
                <button className={`btn btn-secondary ${activeTab == 'nostr' ? 'btn-active' : ''}`} onClick={() => setActiveTab('nostr')}>Nostr</button>
                <button className={`btn btn-secondary ${activeTab == 'onchain' ? 'btn-active' : ''}`} onClick={() => setActiveTab('onchain')}>Onchain</button>
                <button className={`btn btn-secondary ${activeTab == 'oauth' ? 'btn-active' : ''}`} onClick={() => setActiveTab('oauth')}>Oauth</button>
            </div>
            {activeTab === 'oauth' && (
                <div className='shadow p-4'>
                    <Oauth></Oauth>
                </div>
            )}

            {activeTab === 'all' && (
                <div className='shadow'>
                    <div>
                        <p>Socials</p>
                        <AccordionMenu
                            isOpenProps={true}
                            items={[{
                                title: 'Nostr',
                                content: <NostrProfileManagement></NostrProfileManagement>
                            }]}></AccordionMenu>

                    </div>
                    <Divider></Divider>
                    <div>
                        <p>Wallet</p>
                        <WalletConnectButton></WalletConnectButton>
                    </div>
                    <Divider></Divider>
                    <div>
                        <AccordionMenu 
                        
                        items={[{
                            title: 'Oauth',
                            content: <Oauth></Oauth>
                        }]}></AccordionMenu>
                    </div>
                    {/* <Divider></Divider> */}
                </div>
            )}

            {activeTab === 'nostr' && (
                <div className="card shadow p-4">
                    <NostrProfileManagement></NostrProfileManagement>
                </div>
            )}

            {activeTab === 'onchain' && (
                <div className="card shadow p-4">
                    <WalletConnectButton></WalletConnectButton>
                </div>
            )}

        </div>
    );
};
