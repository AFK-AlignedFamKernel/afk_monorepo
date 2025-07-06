'use client';
import React from 'react';
import Link from 'next/link';
import { Icon } from '../small/icon-component';
import { logClickedEvent } from '@/lib/analytics';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import CryptoLoading from '../small/crypto-loading';
import { useAppStore } from '@/store/app';
import { useUIStore } from '@/store/uiStore';
import Onboarding from '.';


interface OnboardingCheckProps {
  isLoadingProp?: boolean;
  isInitalizedProp?: boolean;
  hasOnboardedProp?: boolean;
  isDescriptionVisible?: boolean;
}
export default function OnboardingCheck({ isLoadingProp, isInitalizedProp, hasOnboardedProp, isDescriptionVisible }: OnboardingCheckProps) {

  const { user } = useAppStore();
  const pathname = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitalized, setIsInitalized] = useState(user ? true : false);
  const [hasOnboarded, setHasOnboarded] = useState(false);


  const { showModal } = useUIStore();

  const handleOnboarding = () => {
    console.log('pathname', pathname);
    const hasOnboarded = localStorage.getItem('hasOnboarded');
    console.log('hasOnboarded', hasOnboarded);

    setHasOnboarded(hasOnboarded === 'true' ? true : false);
    if (!hasOnboarded) {
      localStorage.setItem('hasOnboarded', 'true');
      setIsLoading(true);
      // window.location.href = '/onboarding';
      setTimeout(() => {
        router.push('/onboarding');
      // showModal(<Onboarding />)

      }, 3000);
      setIsLoading(false);
    }
    setIsInitalized(true);
  }
  useEffect(() => {

    if (!user && !isInitalized) {
      handleOnboarding();
    }
    setIsInitalized(true);
  }, [isInitalized, user, isLoading]);

  if (!isInitalized || isLoading) {
    return <div>
      {/* <p>Loading...</p> */}
    </div>;
  }

  return (
    <div className="p-4 rounded-lg px-4">

      {isDescriptionVisible && (
        <>

          <h2 className="font-semibold">AFK is your gateway for your Freedom</h2>
          <p className="text-sm">
            Own your digital content, data, money and identity.
          </p>
          <p className="text-sm">
            Get rewarded for your digital data on Internet!

          </p>
        </>

      )}
    </div>
  );
}
