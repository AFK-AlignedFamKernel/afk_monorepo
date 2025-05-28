import './index.css';
import '@rainbow-me/rainbowkit/styles.css';
import '../styles/index.scss';

import type { Metadata } from 'next';
import Script from 'next/script';
import Providers from './providers';
import ClientLayout from './ClientLayout';

export const metadata: Metadata = {
  title: 'AFK community Aligned Fam Kernel',
  description: 'AFK community app for your Digital Freedom, Privacy and Ownership with fun',
};

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS;

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
