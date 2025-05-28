'use client';

import { useState, useEffect, ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAccount } from '@starknet-react/core';
import { WalletConnectButton } from './account/WalletConnectButton';
import { NostrKeyManager, useAuth } from 'afk_nostr_sdk';
import { Icon } from './small/icon-component';
import { useRouter } from 'next/navigation';
import CryptoLoading from './small/crypto-loading';
import Image from 'next/image';
// import { ProfileManagement } from './Nostr/profile/nostr-profile-management';
import { ProfileManagement } from '@/components/profile/profile-management';
import { useUIStore } from '@/store/uiStore';
import Accordion from './small/accordion';

interface RightBarDesktopProps {
  children?: ReactNode;
}

const RightBarDesktop = ({ children }: RightBarDesktopProps) => {
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
    <aside className={`sidebar-right`}>
      <div className="sidebar-nav-right overflow-y-hidden scrollbar-hide">
        <div className="sidebar-nav-header border-l border-gray-200">
          <a href="/" className="sidebar-nav-item" onClick={closeSidebar}>
            <svg className="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M9 22V12H15V22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Home
          </a>

          <div className='sidebar-nav-item'>
            <Accordion title="Nostr"
              items={[{
                title: "Social Nostr",
                icon: (<Icon name="SocialNostr" size={24}></Icon>),
                content: (
                  <>
                    <Link href="/nostr/feed" className="sidebar-nav-item" onClick={closeSidebar}>
                      <Icon name="FeedIcon" size={24} />

                      Feed
                    </Link>
                    <Link href="/nostr/my-profile" className="sidebar-nav-item" onClick={closeSidebar}>
                      <Icon name="UserIcon" size={24} />

                      My Profile
                    </Link>
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
          </div>
          <div className="flex items-center gap-4">
            <button className="btn btn-gradient-green" onClick={() => showModal(<ProfileManagement />)}>
              Connect
            </button>
          </div>

        </div>
      </div>
    </aside>
  );
};

export default RightBarDesktop; 