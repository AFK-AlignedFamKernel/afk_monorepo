'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNostrContext, settingsStore, authStore, NostrKeyManager, useEditProfile } from 'afk_nostr_sdk';
import { generateRandomKeypair } from '../../../../../../packages/afk_nostr_sdk/src/utils/keypair';
import * as bip39 from 'bip39';
import { useUIStore } from '@/store/uiStore';
import { Icon } from '@/components/small/icon-component';
import { logClickedEvent } from '@/lib/analytics';
import NDK, { NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import { AFK_RELAYS } from 'afk_nostr_sdk';

export default function NostrCreateAccountComponent({onClose}: {onClose?: () => void}) {
    const [passkey, setPasskey] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { ndk } = useNostrContext();
    const [username, setUsername] = useState('');
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const editProfile = useEditProfile();

    const [newPrivateKey, setNewPrivateKey] = useState('');
    const [newPublicKey, setNewPublicKey] = useState('');
    const { showToast } = useUIStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await logClickedEvent('create_account', 'nostr', 'create_account', 1)

            const { privateKey, publicKey } = generateRandomKeypair()

            setNewPrivateKey(privateKey);
            setNewPublicKey(publicKey);

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
                message: 'Account created successfully',
                type: 'success',
            })
            // Redirect to home page on success
            //   router.push('/');


        
            try {
                editProfile.mutate({
                    username: username,
                }, {
                    onSuccess: () => {
                        showToast({
                            message: 'Profile updated successfully',
                            type: 'success',
                        })
                    },
                    onError: (error: any) => {
                        console.log('error', error)
                        if (error.message.includes('Profile already exists')) {
                            showToast({
                                message: 'Username already exists',
                                type: 'error',
                            })
                        }
                    
                    }   
                })
            } catch (error) {
                console.log('error', error)
            }

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


        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to set private key');
        }
    };

    return (
        <div className="flex items-center justify-center">
            <div className="max-w-md w-full space-y-8 p-8 rounded-lg shadow">
                <div>
                    <h2 className="mt-6 text-center text-2xl font-extrabold">
                        Create a Nostr account
                    </h2>

                </div>

                {/* <div>
                    <p>Use passkey</p>
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="usePasskey"
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="usePasskey" className="ml-2 block text-sm text-gray-900">
                            Use passkey authentication
                        </label>
                    </div>
                </div> */}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>

                    {error && (
                        <div className="text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <input type="text" placeholder='Username'
                        className='w-full p-2 rounded-md border border-gray-300'
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Create Account
                        </button>
                    </div>
                </form>


                <div className="mt-8 space-y-8">
                    {newPrivateKey && (
                        <div className="rounded-lg border border-yellow-400 p-4 bg-background-secondary dark:bg-background-secondary-dark transition-shadow shadow-md">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Icon name="ConsoleIcon" size={18} className="text-yellow-500" />
                                    <p className="font-semibold text-yellow-700 dark:text-yellow-300">Private key</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(newPrivateKey);
                                        showToast({
                                            message: 'Private key copied to clipboard',
                                            description: "Don't share this with anyone",
                                            type: 'success',
                                        });
                                        logClickedEvent('create_account_copy_private_key', 'nostr', 'copy_private_key', 1);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-yellow-700 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900 transition"
                                    aria-label="Copy private key"
                                >
                                    <Icon name="CopyIcon" size={16} />
                                    Copy
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="mt-1 break-all p-2 rounded bg-background-light dark:bg-background-dark text-sm font-mono select-all border border-yellow-200 dark:border-yellow-800 w-full">
                                    {newPrivateKey}
                                </span>
                                <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-300 font-medium">Keep this safe!</span>
                            </div>
                            <div className="mt-2 text-xs text-yellow-700 dark:text-yellow-300">
                                <strong>Warning:</strong> Your private key gives full access to your account. Never share it with anyone.
                            </div>
                        </div>
                    )}

                    {newPublicKey && (
                        <div className="rounded-lg border border-green-400 p-4 bg-background-secondary dark:bg-background-secondary-dark transition-shadow shadow">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Icon name="LoginIcon" size={18} className="text-green-500" />
                                    <p className="font-semibold text-green-700 dark:text-green-300">Public key</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(newPublicKey);
                                        showToast({
                                            message: 'Public key copied to clipboard',
                                            type: 'success',
                                        });
                                        logClickedEvent('create_account_copy_public_key', 'nostr', 'copy_public_key', 1);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-green-700 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900 transition"
                                    aria-label="Copy public key"
                                >
                                    <Icon name="CopyIcon" size={16} />
                                    Copy
                                </button>
                            </div>
                            <span className="mt-1 break-all p-2 rounded bg-background-light dark:bg-background-dark text-sm font-mono select-all border border-green-200 dark:border-green-800 w-full">
                                {newPublicKey}
                            </span>
                            <div className="mt-2 text-xs text-green-700 dark:text-green-300">
                                Share your public key so others can find you.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
