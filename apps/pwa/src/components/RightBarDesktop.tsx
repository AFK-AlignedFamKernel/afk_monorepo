'use client';

import { useState, useEffect, ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAccount } from '@starknet-react/core';
import { WalletConnectButton } from './account/WalletConnectButton';
import { NostrKeyManager, useAuth } from 'afk_nostr_sdk';
import { Icon } from './small/icon-component';
import { useRouter } from 'next/navigation';
// import { ProfileManagement } from './Nostr/profile/nostr-profile-management';
import { ProfileManagement } from '@/components/profile/profile-management';
import { useUIStore } from '@/store/uiStore';
import Accordion from './small/accordion';
import { useLaunchpadStore } from '@/store/launchpad';
import { useBrandStore } from '@/store/brand';
import { useCreatorsStore } from '@/store/creators';

interface RightBarDesktopProps {
  children?: ReactNode;
}

const RightBarDesktop = ({ children }: RightBarDesktopProps) => {


  const { launchs, setLaunchs } = useLaunchpadStore();
  const { brand } = useBrandStore();
  const { contentCreators } = useCreatorsStore()
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const { showToast, showModal } = useUIStore()
  const [isLoading, setIsLoading] = useState(false);
  const router = typeof window === 'undefined' ? null : useRouter();

  const { address } = useAccount();
  const { publicKey, setAuth } = useAuth();

  const closeSidebar = () => {
    setSidebarOpen(false);
  }

  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true);
      document.body.classList.add('page-transition');
    };

    const handleComplete = () => {
      setIsLoading(false);
      document.body.classList.remove('page-transition');
    };

    // router?.events?.on('routeChangeStart', handleStart);
    // router?.events?.on('routeChangeComplete', handleComplete);
    // router?.events?.on('routeChangeError', handleComplete);

    // return () => {
    //   router?.events?.off('routeChangeStart', handleStart);
    //   router?.events?.off('routeChangeComplete', handleComplete);
    //   router?.events?.off('routeChangeError', handleComplete);
    // };
  }, [router]);

  return (
    <aside className={`sm:hidden lg:block sidebar-right`}>
      <div className="sidebar-nav-right overflow-y-hidden scrollbar-hide">


        <div className="sidebar-nav-header">
        



        </div>


        <div className='p-4'>
          <p>Trending coming soon</p>
        </div>

        {/* <DiscoverComponent /> */}

        {/* <div className='sidebar-nav-item'>
          <Accordion title="Nostr"
            items={[{
              title: "Social Nostr",
              icon: (<Icon name="SocialNostr" size={24}></Icon>),
              content: (
                <>
                  <ListBrand />

                  <Link href="/nostr/login" className="sidebar-nav-item" onClick={closeSidebar}>
                    <Icon name="LoginIcon" size={24} />
                    Login
                  </Link>
                  <Link href="/nostr/create-account" className="sidebar-nav-item" onClick={closeSidebar}>
                    <Icon name="UserPlusIcon" size={24} />
                    Create Account
                  </Link>
                </>)
            },
            ]} />
        </div> */}
      </div>
    </aside>
  );
};

export default RightBarDesktop; 