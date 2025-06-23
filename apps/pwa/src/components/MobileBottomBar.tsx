'use client';

import { useState, useEffect, ReactNode } from 'react';
import Link from 'next/link';
import { useAccount } from '@starknet-react/core';
import { WalletConnectButton } from './account/WalletConnectButton';
import { Icon } from './small/icon-component';
import { useRouter } from 'next/navigation';
import CryptoLoading from './small/crypto-loading';
import Image from 'next/image';
import { useUIStore } from '@/store/uiStore';
import { AvatarIcon } from './small/icons';
import AccordionMenu from './small/AccordionMenu';
import { useColorModeValue } from '@chakra-ui/react';
import CreateAll from './Form/CreateAll';

const MobileBottomBar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { showToast, showModal } = useUIStore()
  const [isLoading, setIsLoading] = useState(false);
  const router = typeof window === 'undefined' ? null : useRouter();

  const bgColor = useColorModeValue('white', '#111418');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', '#9cabba');
  const borderColor = useColorModeValue('gray.200', '#3b4754');
  const bottomBarBg = useColorModeValue('gray.100', '#1b2127');
  const bottomBarBorder = useColorModeValue('gray.200', '#283039');
  const activeTabColor = useColorModeValue('blue.600', 'blue.400');
  const inactiveTabColor = useColorModeValue('gray.600', '#9cabba');

  const { address } = useAccount();
  useEffect(() => {
    if (address) {
      console.log('address', address);
    }
  }, [address]);



  // Close sidebar when window resizes to desktop
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined' && window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Now safe to use localStorage or document
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.body.classList.add('dark-mode');
    } else if (savedTheme === 'light') {
      setDarkMode(false);
      document.body.classList.remove('dark-mode');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(prefersDark);
      if (prefersDark) {
        document.body.classList.add('dark-mode');
      }
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    if (newDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }

  };

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

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

  useEffect(() => {
    setMounted(true);
  }, []);

  // Then use mounted state to guard browser API access
  useEffect(() => {
    if (!mounted) return;
    // Safe to use browser APIs here
  }, [mounted]);

  return (
    <div

      className="fixed bottom-0 left-0 right-0 z-50 md:hidden z-500"
      style={{
        backgroundColor: bottomBarBg,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderTop: `1px solid ${bottomBarBorder}`
      }}
    // style={{ backgroundColor: bottomBarBg }}
    >

      <div>
        <div className="flex gap-8 border-t px-4 pb-3 pt-2 justify-between"
        // style={{ backgroundColor: bottomBarBg, borderColor: bottomBarBorder }}
        >
          <Link href="/">
            <button className="flex flex-1 flex-col items-center justify-end gap-1" style={{ color: secondaryTextColor }}>
              <div className="flex h-8 items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M218.83,103.77l-80-75.48a1.14,1.14,0,0,1-.11-.11,16,16,0,0,0-21.53,0l-.11.11L37.17,103.77A16,16,0,0,0,32,115.55V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V160h32v48a16,16,0,0,0,16,16h48a16,16,0,0,0,16-16V115.55A16,16,0,0,0,218.83,103.77ZM208,208H160V160a16,16,0,0,0-16-16H112a16,16,0,0,0-16,16v48H48V115.55l.11-.1L128,40l79.9,75.43.11.1Z"></path>
                </svg>
              </div>
              <p className="text-xs font-medium leading-normal tracking-[0.015em]">Home</p>

            </button>
          </Link>

          {/* <Link href="/nostr/feed">

            <button className="flex flex-1 flex-col items-center justify-end gap-1" style={{ color: secondaryTextColor }}>
              <div className="flex h-8 items-center justify-center">

                <Icon name="FeedIcon" className='w-6 h-6' />
              </div>
              <p className="text-xs font-medium leading-normal tracking-[0.015em]">Feed</p>
            </button>
          </Link> */}

          {/* <Link href="/discover">

            <button className="flex flex-1 flex-col items-center justify-end gap-1" style={{ color: secondaryTextColor }}>
              <div className="flex h-8 items-center justify-center">

                <Icon name="DiscoverIcon" className='w-6 h-6' />
              </div>
              <p className="text-xs font-medium leading-normal tracking-[0.015em]">Discover</p>
            </button>
          </Link> */}
          {/* <Link href="/create">
            <button className="flex flex-1 flex-col items-center justify-end gap-1" style={{ color: secondaryTextColor }}>
              <div className="flex h-8 items-center justify-center">
                <Icon name="CreateIcon" className='w-6 h-6' />
              </div>
              <p className="text-xs font-medium leading-normal tracking-[0.015em]">Create</p>
            </button>
          </Link> */}
          <button className="flex flex-1 flex-col items-center justify-end gap-1" style={{ color: secondaryTextColor }}
            onClick={() => {
              showModal(<CreateAll />)
            }}
          >
            <div className="flex h-8 items-center justify-center">
              <Icon name="CreateIcon" className='w-6 h-6' />
            </div>
            <p className="text-xs font-medium leading-normal tracking-[0.015em]">Create</p>
          </button>
          <Link href="/launchpad">

            <button className="flex flex-1 flex-col items-center justify-end gap-1" style={{ color: secondaryTextColor }}>
              <div className="flex h-8 items-center justify-center">

                <Icon name="UpwardTrendGraphIcon" className='w-6 h-6' />
              </div>
              <p className="text-xs font-medium leading-normal tracking-[0.015em]">Swap</p>
            </button>
          </Link>

          <Link href="/profile">

            <button className="flex flex-1 flex-col items-center justify-end gap-1 rounded-full">
              <div className="flex h-8 items-center justify-center">
                <Icon name="UserIcon" className='w-6 h-6' />
              </div>
              <p className="text-xs font-medium leading-normal tracking-[0.015em]">Profile</p>
            </button>
          </Link>
          {/* <Link href="/wallet">
            <button className="flex flex-1 flex-col items-center justify-end gap-1" style={{ color: secondaryTextColor }}>
              <div className="flex h-8 items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                  <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H216v96H40Zm176,144H40V160H216v40Z"></path>
                </svg>
              </div>
              <p className="text-xs font-medium leading-normal tracking-[0.015em]">Wallet</p>

            </button>
          </Link> */}
        </div>
      </div>
    </div>
  );
};

export default MobileBottomBar; 