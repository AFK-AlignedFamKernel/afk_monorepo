'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNostrContext, settingsStore, authStore, NostrKeyManager } from 'afk_nostr_sdk';
import { generateRandomKeypair } from '../../../../../../packages/afk_nostr_sdk/src/utils/keypair';
import * as bip39 from 'bip39';
export default function NostrLoginPage() {
    const [passkey, setPasskey] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { ndk } = useNostrContext();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {

            const { privateKey, publicKey } = generateRandomKeypair()

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

            window.localStorage.setItem('privateKey', privateKey)
            window.localStorage.setItem('publicKey', publicKey)
            const mnemonic = bip39.generateMnemonic(128, undefined, bip39.wordlists['english']);

            const seedCashu = bip39.mnemonicToSeedSync(mnemonic).toString('hex');

            // Nostr key manager on storage
            NostrKeyManager?.setNostrWalletConnected({ secretKey: privateKey, publicKey, mnemonic: '', seed: seedCashu });
            NostrKeyManager?.setAccountConnected({ secretKey: privateKey, publicKey, mnemonic: '', seed: seedCashu });
            NostrKeyManager?.setNostrWalletConnectedStorage({ secretKey: privateKey, publicKey, mnemonic: '', seed: seedCashu });


            // Redirect to home page on success
            //   router.push('/');

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to set private key');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to Nostr
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Enter your private key to continue
                    </p>
                </div>

                <div>
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

                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>


                    {error && (
                        <div className="text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Sign in
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
