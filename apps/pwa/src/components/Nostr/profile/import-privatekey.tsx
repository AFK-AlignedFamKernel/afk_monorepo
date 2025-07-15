'use client';

import * as React from 'react';
import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';

import { authStore, generateRandomKeypair, NostrKeyManager, useAuth, useEditProfile, useNostrContext } from 'afk_nostr_sdk';
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import { Avatar } from '@chakra-ui/react';
import { useUIStore } from '@/store/uiStore';
import { Icon } from '@/components/small/icon-component';
import { logClickedEvent } from '@/lib/analytics';
import * as bip39 from 'bip39';
import NDK, { NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import { AFK_RELAYS } from 'afk_nostr_sdk';

interface CustomHeaderInterface {
    title?: string;
    showLogo?: boolean;
    isModalMode?: boolean;
}


export const ImportPrivateKey = ({ title, showLogo, isModalMode }: CustomHeaderInterface) => {
    // const isDesktop = React.useMemo(() => {
    //     return dimensions.width >= 1024;
    // }, [dimensions]);
    const [username, setUsername] = useState('');

    const { publicKey, setAuth } = useAuth();
    const [privateKey, setPrivateKey] = React.useState('');
    const [isOpenProfile, setIsOpenProfile] = React.useState(false);
    const nostrAccounts = NostrKeyManager.getAllNostrAccountsFromStorage();
    const [isWalletSelectOpen, setIsWalletSelectOpen] = React.useState(false);
    const { showToast } = useUIStore();
    const handleIsOpenProfile = () => {
        setIsOpenProfile(!isOpenProfile);
    };
    const editProfile = useEditProfile();


    const { ndk } = useNostrContext();
    const [error, setError] = useState('');
    const nostrProfiles = useMemo(() => {
        if (!nostrAccounts) return [];
        const users: any[] = [];
        for (const [key, value] of Object.entries(nostrAccounts)) {
            users.push(value);
        }
        return users;
    }, [nostrAccounts]);


    const handleImportPrivateKey = async () => {

        try {
            await logClickedEvent('import_private_key', 'nostr', 'import_private_key', 1)

            if (!privateKey) {
                setError('Please enter a private key');
                return;
            }

            setPrivateKey(privateKey);

            const publicKey = NostrKeyManager.getPublicKeyFromSecret(privateKey);

            if (!publicKey) {
                return showToast({
                    message: 'Invalid private key',
                    type: 'error',
                })
            }
            console.log('keypair', privateKey, publicKey);

            authStore.getState().setAuth(
                privateKey,
                publicKey,
            )

            NostrKeyManager.setNostrWalletConnected({
                secretKey: privateKey,
                publicKey,
                mnemonic: '',
                seed: '',
            })

            // window.localStorage.setItem('privateKey', privateKey)
            // window.localStorage.setItem('publicKey', publicKey)
            const mnemonic = bip39.generateMnemonic(128, undefined, bip39.wordlists['english']);

            const seedCashu = bip39.mnemonicToSeedSync(mnemonic).toString('hex');

            // Nostr key manager on storage
            NostrKeyManager?.setNostrWalletConnected({ secretKey: privateKey, publicKey, mnemonic: '', seed: seedCashu });
            NostrKeyManager?.setAccountConnected({ secretKey: privateKey, publicKey, mnemonic: '', seed: seedCashu });
            NostrKeyManager?.setNostrWalletConnectedStorage({ secretKey: privateKey, publicKey, mnemonic: '', seed: seedCashu });



            showToast({
                message: 'Account imported successfully',
                type: 'success',
            })
            // Redirect to home page on success
            //   router.push('/');




        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to set private key');
            showToast({
                message: 'Failed to import account, please try again',
                type: 'error',
            })
        }
    };

    const updateMyProfile = async () => {

        try {
            console.log('create nostr profile')

            const ndk = new NDK({
                explicitRelayUrls: AFK_RELAYS,
                signer: new NDKPrivateKeySigner(privateKey),
            })

            await ndk.connect()
            console.log('ndk', ndk)

            const user = ndk.getUser({ pubkey: publicKey });
            await user.fetchProfile();
            // console.log('user.profile', user.profile);

            if (!user.profile) {
                // throw new Error('Profile not found');
            }

            user.profile = { ...user.profile, name: username, display_name: username };

            await user.publish();
            showToast({
                message: 'Account created successfully',
                type: 'success',
            })
        } catch (error) {
            console.log('error', error)
            showToast({
                message: 'Failed to create account, please try again',
                type: 'error',
            })

        }

    }


    return (
        <div className='flex flex-col gap-2 py-4'>



            <div style={{
                display: 'flex',
                justifyContent: 'flex-start',
                // padding: '10px',
                gap: '10px'
            }}>

                <input type="text"
                    className='border-afk-accent-cyan w-full p-2 rounded-md'
                    placeholder='Enter private key' value={privateKey} onChange={(e) => setPrivateKey(e.target.value)} />
                <button className='btn btn-primary' onClick={() => {
                    handleImportPrivateKey();
                }}>Import</button>


            </div>



        </div>
    );
};
