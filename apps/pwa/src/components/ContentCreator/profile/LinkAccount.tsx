"use client"
import { useUIStore } from '@/store/uiStore';
import { useState } from 'react';
import LinkAccountModal from './LinkAccountModal';

interface SocialAccount {
    id: string;
    platform: string;
    username: string;
    status: 'linked' | 'pending' | 'unlinked';
}

export default function LinkAccount() {
    const { showToast, showModal } = useUIStore();
    const [accounts, setAccounts] = useState<SocialAccount[]>([
        { id: '1', platform: 'X', username: '@username', status: 'linked' },
        { id: '2', platform: 'Youtube', username: 'channel', status: 'pending' },
        { id: '3', platform: 'Tiktok', username: '@tiktok', status: 'unlinked' },
    ]);
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);

    const handleLinkAccount = async (platform: string) => {
        setSelectedPlatform(platform);
        // showModal(<LinkAccountModal platform={platform} onClose={() => setSelectedPlatform(null)} onSubmit={handleModalSubmit} />
        // );
    };

    const handleModalSubmit = async (handle: string) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/profile/link-account`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    platform: selectedPlatform,
                    handle,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate verification code');
            }

            const data = await response.json();
            showToast({ message: `Verification code generated: ${data.verificationCode}`, type: 'success' });
            setSelectedPlatform(null);

            // Update account status to pending
            setAccounts(accounts.map(acc =>
                acc.platform === selectedPlatform
                    ? { ...acc, status: 'pending', username: handle }
                    : acc
            ));
        } catch (error) {
            showToast({ message: 'Failed to generate verification code', type: 'error' });
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Link Your Social Accounts</h2>

            {/* Grid of social platforms */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {accounts.map((account) => (
                    <div key={account.id} className="border rounded-lg p-4">
                        <h3 className="font-semibold">{account.platform}</h3>
                        <p className="text-gray-600">{account.username}</p>
                        <button
                            className={`mt-2 px-4 py-2 rounded ${account.status === 'linked'
                                ? 'bg-green-500 text-white'
                                : account.status === 'pending'
                                    ? 'bg-yellow-500 text-white'
                                    : 'bg-blue-500 text-white'
                                }`}
                            onClick={() => handleLinkAccount(account.platform)}
                        >
                            {account.status === 'linked'
                                ? 'Linked'
                                : account.status === 'pending'
                                    ? 'Pending'
                                    : 'Link Account'}
                        </button>
                    </div>
                ))}
            </div>

            {/* Pending verifications list */}
            <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Pending Verifications</h3>
                <ul className="space-y-2">
                    {accounts
                        .filter(account => account.status === 'pending')
                        .map(account => (
                            <li key={account.id} className="flex items-center justify-between border-b pb-2">
                                <span>{account.platform}: {account.username}</span>
                                <span className="text-yellow-500">Pending verification</span>
                            </li>
                        ))}
                </ul>
            </div>

            {selectedPlatform && (
                <LinkAccountModal
                    platform={selectedPlatform}
                    onClose={() => setSelectedPlatform(null)}
                    onSubmit={handleModalSubmit}
                />
            )}
        </div>
    );
}