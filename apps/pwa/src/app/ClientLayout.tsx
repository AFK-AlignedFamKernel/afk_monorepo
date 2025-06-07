'use client';

import { Box, useColorModeValue } from '@chakra-ui/react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Layout from '../components/Layout';

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS;

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  

  useEffect(() => {
    console.log('pathname', pathname);
    const hasOnboarded = localStorage.getItem('hasOnboarded');
    console.log('hasOnboarded', hasOnboarded);

    if (!hasOnboarded) {
      localStorage.setItem('hasOnboarded', 'true');
      window.location.href = '/onboarding';
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

  return (
    <Box bg={bgColor} color={textColor}>
      <Layout>{children}</Layout>
    </Box>
  );
} 