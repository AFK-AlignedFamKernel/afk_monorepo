import './index.css';
import '@rainbow-me/rainbowkit/styles.css';

import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'afk community portal',
  description: 'afk community portal',
};
import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { useEffect } from 'react';

import Providers from './providers';
import { Box, useColorModeValue } from '@chakra-ui/react';

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS; // Replace with your actual tracking ID

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const bgColor = useColorModeValue("gray.300", "gray.700");
  const textColor = useColorModeValue("gray.800", "gray.300");

  // Track page views
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (typeof window !== 'undefined') {
        window.gtag('config', GA_TRACKING_ID, {
          page_path: url,
        });
      }
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <Providers>
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
      <Box
        bg={bgColor}
        color={textColor}
      >
        <Component {...pageProps} />
      </Box>
    </Providers>
  );
}

export default MyApp;
