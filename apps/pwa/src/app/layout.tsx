import './index.css';
import '@rainbow-me/rainbowkit/styles.css';

import type {Metadata} from 'next';
// import {useRouter} from 'next/router';
import Script from 'next/script';

import Providers from './providers';

export const metadata: Metadata = {
  title: 'AFK community LFG',
  description: 'AFK community LFG app. Have fun',
};
const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS; // Replace with your actual tracking ID

export default function RootLayout({children}: {children: React.ReactNode}) {
  // // Track page views
  // const router = useRouter();
  // useEffect(() => {
  //   const handleRouteChange = (url: string) => {
  //     if (typeof window !== 'undefined') {
  //       window.gtag('config', GA_TRACKING_ID, {
  //         page_path: url,
  //       });
  //     }
  //   };
  //   router.events.on('routeChangeComplete', handleRouteChange);
  //   return () => {
  //     router.events.off('routeChangeComplete', handleRouteChange);
  //   };
  // }, [router.events]);
  return (
    <html lang="en">
      <head>
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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
