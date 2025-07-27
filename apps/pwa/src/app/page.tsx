'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/store/app';
import CryptoLoading from '@/components/small/crypto-loading';
import DiscoveryComponent from '@/components/Discovery/Discover';
import { FeedTabs } from '@/components/Nostr/feed';

// const DiscoverComponent = dynamic(() => import('@/components/Discovery/Discover'), {
//   loading: () => <CryptoLoading />,

//   // loading: () => <div style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>,
// });
const OnboardingCheck = dynamic(() => import('@/components/Onboarding/OnboardingCheck'), {
  loading: () => null,
  ssr: false,
});

// Use inline Layout to avoid type issues
export default function HomePage() {
  const { user, setUser } = useAppStore();
  return (
    <div className="content" style={{ minHeight: 400, }}>

      <div className='flex flex-col gap-4 my-4'>
        {/* <DiscoverComponent /> */}
        <FeedTabs />
        {/* <DiscoveryComponent></DiscoveryComponent> */}
        <OnboardingCheck />
      </div>

    </div>
  );
}
