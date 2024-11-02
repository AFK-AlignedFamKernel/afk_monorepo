import './index.css';
import '@rainbow-me/rainbowkit/styles.css';

import type {Metadata} from 'next';

import Providers from './providers';
import {NotificationProvider} from './providers/NotificationProvider';

export const metadata: Metadata = {
  title: 'afk community portal',
  description: 'afk community portal',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <Providers>
        <body>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </body>
      </Providers>
    </html>
  );
}
