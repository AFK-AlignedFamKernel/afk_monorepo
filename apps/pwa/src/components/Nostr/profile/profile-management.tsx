'use client';

import * as React from 'react';
import Image from 'next/image';
import { useCallback, useMemo } from 'react';

import { NostrKeyManager, useAuth } from 'afk_nostr_sdk';
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import { Avatar } from '@chakra-ui/react';
import { useUIStore } from '@/store/uiStore';
import { Icon } from '@/components/small/icon-component';
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
    const [isOpenProfile, setIsOpenProfile] = React.useState(true);
    const nostrAccounts = NostrKeyManager.getAllNostrAccountsFromStorage();
    const [isWalletSelectOpen, setIsWalletSelectOpen] = React.useState(true);
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

            {nostrProfiles.length > 0 ? (
                <div>
                    <p className='text-sm'>Nostr Accounts : {nostrProfiles.length}</p>
                </div>
            ) : (
                <div>
                    <p className='text-sm'>No Nostr Accounts</p>
                </div>
            )}

            {publicKey && (
                <div>
                    <p className='text-sm' style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>Public Key connected: {publicKey}</p>
                </div>
            )}
            {/* {isModalMode && isOpenProfile && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '500px'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                onClick={handleIsOpenProfile}
                                style={{
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <span>{isOpenProfile ? 'Close' : 'Open'}</span>
                            </button>
                        </div>

                        <div style={{ padding: '20px' }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                marginBottom: '1rem'
                            }}>Nostr Accounts</h2>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                            }}>
                                {nostrProfiles.map((item: any, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            setAuth(item?.publicKey, item?.secretKey);
                                            NostrKeyManager.setAccountConnected(item);
                                            handleIsOpenProfile();
                                        }}
                                        style={{
                                            padding: '10px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <span>{item?.publicKey?.slice(0, 8)}...{item?.publicKey?.slice(-8)}</span>
                                    </button>
                                ))}
                            </div>

                            <h2 style={{
                                fontSize: '1.5rem',
                                margin: '1rem 0'
                            }}>Wallets</h2>
                        </div>
                    </div>
                </div>
            )} */}

            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '10px'
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

                        <Icon name="ChevronDown" size={16} />
                    </button>

                </div>

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
                                        gap: '10px'
                                    }}
                                    onClick={() => {
                                        // setAuth(item?.publicKey, item?.secretKey);
                                        // NostrKeyManager.setAccountConnected(item);
                                        handleIsOpenProfile();
                                        handleConnectWallet(item);
                                    }}
                                >

                                    <div className='flex flex-row gap-2'>
                                        <div
                                            style={{
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}
                                        >
                                            <p className='text-sm overflow-hidden text-ellipsis'>{item?.publicKey}</p>
                                            <p className='text-sm'>{item?.name}</p>
                                            <p className='text-sm'>{item?.username}</p>


                                            <div>
                                                <button className='btn btn-primary'>Connect</button>
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
