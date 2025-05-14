'use client';

import '@rainbow-me/rainbowkit/styles.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import NDK from '@nostr-dev-kit/ndk';
import { settingsStore, NostrProvider, TanstackProvider, useNostrContext } from 'afk_nostr_sdk';

import StarknetProvider from '@/context/StarknetProvider';
import { AFK_RELAYS } from 'common';
import { UIProvider } from '@/providers/UIProvider';
import { CashuProvider } from '@/providers/CashuProvider';


// Custom wrapper for NostrProvider that ensures relays are configured
const RelayInitializer: React.FC<{children: React.ReactNode}> = ({ children }) => {
  useEffect(() => {
    // Set relays in the settings store
    settingsStore.getState().setRelays(AFK_RELAYS);
  }, []);
  
  return <>{children}</>;
};

// Add NDK functionality to children components
const NDKConnector: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { ndk, setNDK } = useNostrContext();
  
  useEffect(() => {
    // When relay settings are already loaded, connect NDK
    if (settingsStore.getState().relays.length > 0 && !ndk) {
      // Create an NDK instance
      const ndkInstance = new NDK({
        explicitRelayUrls: settingsStore.getState().relays,
      });
      
      // Connect to relays
      ndkInstance.connect().then(() => {
        console.log('Connected to relays!');
        // Set the NDK instance in the context
        setNDK(ndkInstance);
      }).catch(err => {
        console.error('Failed to connect to relays', err);
      });
      
      // Cleanup on unmount
      return () => {
        ndkInstance.disconnect();
      };
    }
  }, [ndk, setNDK]);
  
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
              <CashuProvider>
                <UIProvider>
                  <NDKConnector>
                    {children}
                  </NDKConnector>
                </UIProvider>
              </CashuProvider>
            </NostrProvider>
          </RelayInitializer>
        </TanstackProvider>
      </QueryClientProvider>
    </StarknetProvider>
  );
}
