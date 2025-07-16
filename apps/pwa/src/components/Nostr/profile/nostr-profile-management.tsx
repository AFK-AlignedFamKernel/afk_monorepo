'use client';

import * as React from 'react';
import Image from 'next/image';
import { useCallback, useMemo } from 'react';

import { NostrKeyManager, useAuth, useNip07Extension } from 'afk_nostr_sdk';
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import { Avatar } from '@chakra-ui/react';
import { useUIStore } from '@/store/uiStore';
import { Icon } from '@/components/small/icon-component';
import { nip19 } from 'nostr-tools';

import { ImportPrivateKey } from './import-privatekey';
import NostrCreateAccountComponent from '../login/NostrCreateAccount';
import { BasicButton, ButtonPrimary } from '@/components/button/Buttons';
import { logClickedEvent } from '@/lib/analytics';
interface CustomHeaderInterface {
    title?: string;
    showLogo?: boolean;
    isModalMode?: boolean;
}


export const NostrProfileManagement = ({ title, showLogo, isModalMode }: CustomHeaderInterface) => {
    // const isDesktop = React.useMemo(() => {
    //     return dimensions.width >= 1024;
    // }, [dimensions]);
    const { getPublicKey } = useNip07Extension();

    const { publicKey, setAuth } = useAuth();
    const [isOpenProfile, setIsOpenProfile] = React.useState(false);
    const nostrAccounts = NostrKeyManager.getAllNostrAccountsFromStorage();
    const [isWalletSelectOpen, setIsWalletSelectOpen] = React.useState(false);
    const { showToast } = useUIStore();
    const handleIsOpenProfile = () => {
        setIsOpenProfile(!isOpenProfile);
    };


    const handleLoginWithNip7 = async () => {
     
        try {
            logClickedEvent('try_login_with_nip7', 'nostr', 'try_login_with_nip7', 1)
            const publicKey = await getPublicKey();
            console.log("publicKey", publicKey);
            if(publicKey){
                logClickedEvent('login_with_nip7_success', 'nostr', 'login_with_nip7_success', 1)
                showToast({
                    message: 'Account connected successfully',
                    type: 'success',
                })
            }
        } catch (error) {
            console.log("error", error)
            logClickedEvent('error_login_with_nip7', 'nostr', 'error_login_with_nip7', 1)
            showToast({
                message: 'Failed to login with Nip7',
                type: 'error',
            })
        }
    }
    const [activeTab, setActiveTab] = React.useState<"create" | "manage" | 'import' | 'nip7'>('manage');

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
        NostrKeyManager?.setNostrWalletConnected({ secretKey: item?.secretKey, publicKey: item?.publicKey, mnemonic: '', seed: '' });
        showToast({
            message: `Wallet connected: ${item?.publicKey}`,
            description: "You are now connected to the wallet",
            type: "success"
        })
        logClickedEvent('connect_nostr_wallet', 'nostr', 'connect_nostr_wallet', 1)
        // handleIsOpenProfile();

    }

    return (
        <div style={{
            padding: 8,
            textAlign: "left"
        }}>

            {nostrProfiles.length > 0 ? (
                <div>
                    <p className='text-sm'>Nostr Accounts : {nostrProfiles.length}</p>
                </div>
            ) : (
                <div>
                    <p className='text-sm'>No Nostr Accounts</p>


                    {/* <button className='btn btn-secondary' onClick={() => {
                        setActiveTab('import');
                    }}>Import</button>
                    <button className='btn btn-secondary' onClick={() => {  
                        setActiveTab('manage');
                    }}>Manage</button> */}
                </div>
            )}

            {publicKey && (
                <div className='flex flex-col gap-2'>
                    <div className='flex flex-row gap-2 cursor-pointer'
                        onClick={() => {
                            navigator.clipboard.writeText(publicKey);
                            showToast({
                                message: "Public key copied to clipboard",
                                type: "success"
                            });
                        }}
                    >
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

                    <div className='flex flex-row gap-2 align-baseline cursor-pointer'
                        onClick={() => {
                            navigator.clipboard.writeText(nip19.npubEncode(publicKey));
                            showToast({
                                message: "Npub copied to clipboard",
                                type: "success"
                            });
                        }}>
                        <p className='text-sm overflow-hidden text-ellipsis'>{nip19.npubEncode(publicKey)}</p>
                        <div
                            className='cursor-pointer'
                        >
                            <Icon name="CopyIcon"
                                className='cursor-pointer'
                                size={16}
                                onClick={() => {
                                    navigator.clipboard.writeText(nip19.npubEncode(publicKey));
                                    showToast({
                                        message: "Npub copied to clipboard",
                                        type: "success"
                                    });
                                }}
                            /></div>
                    </div>
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
                    <button className='btn btn-basic' onClick={() => {
                        setIsOpenProfile(!isOpenProfile);
                    }}>View more</button>
                )}

            </div>

            <div className="my-2">

                <div className='flex flex-row gap-2 justify-start'>

                    <ButtonPrimary className={`btn btn-basic ${activeTab === 'import' ? 'border-afk-accent-cyan' : ''}`} onClick={() => {
                        setActiveTab('import');
                    }}>Import</ButtonPrimary>

                    <BasicButton className={`btn btn-basic ${activeTab === 'create' ? 'border-afk-accent-cyan' : ''}`} onClick={() => {
                        setActiveTab('create');
                    }}>Create</BasicButton>


                    <BasicButton
                        className={`btn btn-basic ${activeTab === 'nip7' ? 'border-afk-accent-cyan' : ''}`}
                        onClick={() => {
                            setActiveTab('nip7');
                            handleLoginWithNip7();
                        }}
                    >Login</BasicButton>

                </div>

                {activeTab === 'import' && (
                    <ImportPrivateKey />
                )}


                {activeTab === 'create' && (
                    <div>
                        <NostrCreateAccountComponent />
                    </div>
                )}
                {/* 
                {activeTab === 'nip7' && (
                    <div>
                        <button onClick={() => {
                            handleLoginWithNip7();
                        }}>Login</button>
                    </div>
                )} */}

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
                                                <p className='text-sm overflow-hidden text-ellipsis'>{nip19.npubEncode(item?.publicKey)}</p>
                                                <div onClick={() => {
                                                    navigator.clipboard.writeText(nip19.npubEncode(item?.publicKey));
                                                    showToast({
                                                        message: "Npub copied to clipboard",
                                                        type: "success"
                                                    });
                                                }}>
                                                    <Icon name="CopyIcon" size={16}
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(nip19.npubEncode(item?.publicKey));
                                                            showToast({
                                                                message: "Npub copied to clipboard",
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
