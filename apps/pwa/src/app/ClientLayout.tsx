'use client';

import { Box, useColorModeValue } from '@chakra-ui/react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useNostrContext, useSettingsStore } from 'afk_nostr_sdk';
// import { useAppStore } from '@/store/app';
// import CryptoLoading from '@/components/small/crypto-loading';

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS;

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();


  useEffect(() => {
    console.log('pathname', pathname);
    const hasOnboarded = localStorage.getItem('hasOnboarded');
    console.log('hasOnboarded', hasOnboarded);

    if (!hasOnboarded) {
      localStorage.setItem('hasOnboarded', 'true');
      // window.location.href = '/onboarding';

    }
  }, []);


  // Track page views
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.gtag('config', GA_TRACKING_ID, {
        page_path: pathname,
      });
    }
  }, [pathname]);

  const bgColor = useColorModeValue('gray.300', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.300');

  const { ndk } = useNostrContext()
  const [isConnectedLoading, setIsConnectedLoading] = useState(false)
  const { setIsConnected, isConnected } = useSettingsStore()
  // console.log("isConnected", isConnected)
  // useEffect(() => {
  //   // console.log("ndk", ndk)

  //   if(ndk?.pool?.connectedRelays().length > 0 && !isConnected) {
  //     console.log("connectedRelays", ndk?.pool?.connectedRelays)
  //     setIsConnected(true)
  //   } else {
  //     console.log("not connected")
  //     setIsConnected(false)
  //     setIsConnectedLoading(true)
  //     ndk?.connect()
  //     setIsConnectedLoading(false)
  //     setIsConnected(true)
  //   }
  // }, [ndk])

  return (
    <Box bg={bgColor} color={textColor}>
      <Layout>{children}</Layout>
    </Box>
  );
} 