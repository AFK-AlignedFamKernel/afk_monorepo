'use client';

import '@rainbow-me/rainbowkit/styles.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import NDK from '@nostr-dev-kit/ndk';
import { settingsStore, NostrProvider, TanstackProvider, useNostrContext } from 'afk_nostr_sdk';

import StarknetProvider from '@/context/StarknetProvider';
import { AFK_RELAYS } from 'common';


// Custom wrapper for NostrProvider that ensures relays are configured
const RelayInitializer: React.FC<{children: React.ReactNode}> = ({ children }) => {
  useEffect(() => {
    // Set relays in the settings store
    settingsStore.getState().setRelays(AFK_RELAYS);
  }, []);
  
  return <>{children}</>;
};

// Ensure NDK is connected as soon as NostrProvider is mounted
const NDKConnector: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { ndk } = useNostrContext();
  
  useEffect(() => {
    const connectNDK = async () => {
      try {
        console.log('Connecting NDK to relays...');
        await ndk.connect();
        console.log('NDK connected successfully');
      } catch (err) {
        console.error('Failed to connect NDK:', err);
      }
    };
    
    connectNDK();
    
    // Set up reconnection on focus
    const handleFocus = () => {
      console.log('Window focused, reconnecting NDK');
      connectNDK();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [ndk]);
  
  return <>{children}</>;
};

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();

  return (
    <StarknetProvider>
      <QueryClientProvider client={queryClient}>
        <TanstackProvider>
          <RelayInitializer>
            <NostrProvider>
              <NDKConnector>
                {children}
              </NDKConnector>
            </NostrProvider>
          </RelayInitializer>
        </TanstackProvider>
      </QueryClientProvider>
    </StarknetProvider>
  );
}
