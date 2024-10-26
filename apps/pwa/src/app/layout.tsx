import './index.css';
import '@rainbow-me/rainbowkit/styles.css';

import {Box} from '@chakra-ui/react';
import type {Metadata} from 'next';

import Providers from './providers';
export const metadata: Metadata = {
  title: 'AFK community LFG',
  description: 'AFK community LFG app. Have fun',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <Providers>
        <body>
          <Box>{children}</Box>
        </body>
      </Providers>
    </html>
  );
}
