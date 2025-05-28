import './index.css';
import '@rainbow-me/rainbowkit/styles.css';
import '../styles/index.scss';

import type { Metadata } from 'next';
import Script from 'next/script';
import { Box, useColorModeValue } from '@chakra-ui/react';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import Providers from './providers';
import Layout from '../components/Layout';

export const metadata: Metadata = {
  title: 'AFK community Aligned Fam Kernel',
  description: 'AFK community app for your Digital Freedom, Privacy and Ownership with fun',
};

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
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
    <html lang="en">
      <head>
        {/* <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" /> */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_path: window.location.pathname,
            });
          `,
          }}
        />
      </head>
      <body style={{ margin: 0, padding: 0, width: '100%' }}>
        <Providers>
          <Box bg={bgColor} color={textColor}>
            <Layout>{children}</Layout>
          </Box>
        </Providers>
      </body>
    </html>
  );
}
