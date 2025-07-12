'use client';

import * as React from 'react';
import Image from 'next/image';
import { useCallback, useMemo } from 'react';

import { NostrKeyManager, useAuth } from 'afk_nostr_sdk';
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import { Avatar } from '@chakra-ui/react';
import { useUIStore } from '@/store/uiStore';
import { Icon } from '@/components/small/icon-component';
import { ImportPrivateKey } from './import-privatekey';
interface CustomHeaderInterface {
    title?: string;
    showLogo?: boolean;
    isModalMode?: boolean;
}


export const NostrProfileManagement = ({ title, showLogo, isModalMode }: CustomHeaderInterface) => {
    // const isDesktop = React.useMemo(() => {
    //     return dimensions.width >= 1024;
    // }, [dimensions]);

    const { publicKey, setAuth } = useAuth();
    const [isOpenProfile, setIsOpenProfile] = React.useState(false);
    const nostrAccounts = NostrKeyManager.getAllNostrAccountsFromStorage();
    const [isWalletSelectOpen, setIsWalletSelectOpen] = React.useState(false);
    const { showToast } = useUIStore();
    const handleIsOpenProfile = () => {
        setIsOpenProfile(!isOpenProfile);
    };

    const [activeTab, setActiveTab] = React.useState<"create" | "manage" | 'import'>('create');

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
            padding: 8,
            textAlign:"left"
        }}>

            {nostrProfiles.length > 0 ? (
                <div>
                    <p className='text-sm'>Nostr Accounts : {nostrProfiles.length}</p>
                </div>
            ) : (
                <div>
                    <p className='text-sm'>No Nostr Accounts</p>
                    <button className='btn btn-secondary' onClick={() => {
                        setActiveTab('create');
                    }}>Create</button>
                    {/* <button className='btn btn-secondary' onClick={() => {
                        setActiveTab('import');
                    }}>Import</button>
                    <button className='btn btn-secondary' onClick={() => {  
                        setActiveTab('manage');
                    }}>Manage</button> */}
                </div>
            )}

            {publicKey && (
                <div className='flex flex-row gap-2'>
                    <p className='text-sm' style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>Connected: {publicKey?.slice(0, 5)}...{publicKey?.slice(-5)}</p>


                    <div onClick={() => {
                        navigator.clipboard.writeText(publicKey);
                        showToast({
                            message: "Public key copied to clipboard",
                            type: "success"
                        });
                    }}><Icon name="CopyIcon" size={16} /></div>

                </div>
            )}

            <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                // padding: '10px',
                gap: '10px'
            }}>
                <div style={{ position: 'relative' }}>
                    <button
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 16px',
                            border: '1px solid #ddd',
                            borderRadius: '20px',
                            cursor: 'pointer'
                        }}
                        onClick={handleIsOpenProfile}
                    >
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            overflow: 'hidden'
                        }}>
                            <Avatar
                                src="/assets/pepe-uhoh.png"
                            />
                        </div>

                        {/* <Icon name="ChevronDown" size={16} /> */}

                        {publicKey && (
                            <span>{publicKey?.slice(0, 3)}...{publicKey?.slice(-5)}</span>
                        )}

                        {/* <div onClick={() => {
                            navigator.clipboard.writeText(publicKey);
                            showToast({
                                message: "Public key copied to clipboard",
                                type: "success"
                            });
                        }}>Copy <Icon name="CopyIcon" size={8} /></div> */}

                        <Icon name="ChevronDown" size={16} />
                    </button>

                </div>

                {nostrProfiles.length > 1 && (
                    <button className='btn btn-secondary' onClick={() => {
                        setIsOpenProfile(!isOpenProfile);
                    }}>View more</button>
                )}

            </div>

            <div>
                <button className='btn btn-secondary' onClick={() => {
                    setActiveTab('import');
                }}>Import</button>

                {activeTab === 'import' && (
                    <ImportPrivateKey />
                )}
            </div>




            {!isModalMode && isOpenProfile && (
                <div>
                    <h2 style={{
                        fontSize: '1.5rem',
                        margin: '1rem 0'
                    }}>Accounts</h2>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                    }}>
                        {nostrProfiles.map((item: any, index) => {
                            return (
                                <div
                                    key={index}
                                    style={{
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '10px',
                                        cursor: 'pointer'
                                    }}
                                // onClick={() => {
                                //     // setAuth(item?.publicKey, item?.secretKey);
                                //     // NostrKeyManager.setAccountConnected(item);
                                //     handleIsOpenProfile();
                                //     handleConnectWallet(item);
                                // }}
                                >

                                    <div className='flex flex-row gap-2'>
                                        <div
                                            style={{
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}
                                        >
                                            <p className='text-sm'>{item?.name}</p>
                                            <p className='text-sm'>{item?.username}</p>
                                            <div className='flex flex-row gap-2 align-baseline'>
                                                <p className='text-sm overflow-hidden text-ellipsis'>{item?.publicKey}</p>
                                                <div onClick={() => {
                                                    navigator.clipboard.writeText(item?.publicKey);
                                                    showToast({
                                                        message: "Public key copied to clipboard",
                                                        type: "success"
                                                    });
                                                }}>
                                                    <Icon name="CopyIcon" size={16}
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(item?.publicKey);
                                                            showToast({
                                                                message: "Public key copied to clipboard",
                                                                type: "success"
                                                            });
                                                        }}
                                                    /></div>
                                            </div>
                                            <div className='flex flex-row gap-2 align-baseline'>
                                                {publicKey == item?.publicKey &&
                                                    <Icon name="CheckIcon" size={16}></Icon>
                                                }
                                                <button
                                                    onClick={() => {
                                                        handleConnectWallet(item);
                                                    }}

                                                    className={`btn btn-secondary ${publicKey == item?.publicKey ? 'btn-success' : ''}`}>Connect
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
