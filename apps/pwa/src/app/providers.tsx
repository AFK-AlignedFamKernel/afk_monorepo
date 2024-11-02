'use client';

import '@rainbow-me/rainbowkit/styles.css';

import {ChakraProvider} from '@chakra-ui/react';
import {getDefaultConfig, RainbowKitProvider} from '@rainbow-me/rainbowkit';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {WagmiProvider} from 'wagmi';

import StarknetProvider from '@/context/StarknetProvider';
import {NotificationProvider} from './providers/NotificationProvider';
import {config} from './wagmiConfig'; // We'll create this file

const queryClient = new QueryClient();

export default function Providers({children}: {children: React.ReactNode}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ChakraProvider>
            <StarknetProvider>
              <NotificationProvider>{children}</NotificationProvider>
            </StarknetProvider>
          </ChakraProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
