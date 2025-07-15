'use client';
import { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';
import { NostrProfileManagement } from '../Nostr/profile/nostr-profile-management';
import NostrCreateAccountComponent from '../Nostr/login/NostrCreateAccount';
import { WalletConnectButton } from '../account/WalletConnectButton';
import Link from 'next/link';
import { useAuth } from 'afk_nostr_sdk';
import { useAccount } from '@starknet-react/core';
import { logClickedEvent } from '@/lib/analytics';
import { ImportPrivateKey } from '../Nostr/profile/import-privatekey';
import { Icon } from '../small/icon-component';

export default function User() {
  const router = useRouter();

  const { publicKey } = useAuth();
  const { address } = useAccount();
  const [isImportOpen, setIsImportOpen] = useState(false);

  const [step, setStep] = useState(0);

  const handleLfg = () => {
    logClickedEvent('finished_onboarding_user', 'nostr', 'onboarding_user', 1)
    router.push("/")
  }
  const handleNextStep = () => {
    setStep(step + 1);
  };

  const handleBackStep = () => {
    if (step === 0) {
      // setIsImportOpen(!isImportOpen);
    } else {
      setStep(step - 1);
    }
  };

  const isNostrConnected = useMemo(() => publicKey && address, [publicKey, address]);
  const isWalletConnected = useMemo(() => address, [address]);
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col items-center space-y-8 justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">

          {step === 0 && <>
            <NostrCreateAccountComponent />

          </>}

          {step === 1 && (!isNostrConnected || !isWalletConnected) && <div className='flex flex-col gap-4'>
            <NostrProfileManagement />
            <WalletConnectButton />
          </div>}

          {step === 2 && (isNostrConnected) && <div className='flex flex-col gap-4'>
            <p>You are all set up!</p>

            <div className='flex flex-row gap-4 grid grid-cols-2'>

              <Link href='/nostr/feed'

                onClick={() => {
                  logClickedEvent('feed', 'nostr', 'feed', 1)
                }}
                className="border border-gray-300 rounded-md p-2">
                <span className='text-sm'>Feed</span>
              </Link>

              <Link href='/create'
                onClick={() => {
                  logClickedEvent('create', 'nostr', 'create', 1)
                }}
                className="border border-gray-300 rounded-md p-2">
                <span className='text-sm'>Create something</span>
              </Link>

              <Link href='/launchpad'
                onClick={() => {
                  logClickedEvent('launchpad', 'nostr', 'launchpad', 1)
                }}
                className="border border-gray-300 rounded-md p-2">
                <span className='text-sm'>Launchpad</span>
              </Link>
            </div>

          </div>}




          <div className='flex flex-row justify-between gap-4 mt-4'>
            <button onClick={handleBackStep}>Back</button>

            {step >= 1 ?
              <button className='btn btn-primary px-4 py-2 rounded-md' onClick={handleLfg}>LFG</button>
              :
              <button className='border border-primary px-4 py-2 rounded-md' onClick={handleNextStep}>Next</button>
            }
          </div>

        </div>
      </div>
    </div>
  );
}
