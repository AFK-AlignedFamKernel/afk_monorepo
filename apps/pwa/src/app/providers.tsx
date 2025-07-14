'use client';

import '@rainbow-me/rainbowkit/styles.css';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import NDK from '@nostr-dev-kit/ndk';
import { settingsStore, NostrProvider, TanstackProvider, useNostrContext } from 'afk_nostr_sdk';
import dynamic from 'next/dynamic';

import { AFK_RELAYS } from 'common';
import { UIProvider } from '@/providers/UIProvider';
import { CashuProvider } from '@/providers/CashuProvider';
import AuthNostrProviderComponent from '@/components/Nostr/relay/AuthNostrProvider';

// Dynamically import StarknetProvider with SSR disabled
const StarknetProvider = dynamic(() => import('@/context/StarknetProvider'), {
  ssr: false,
});

// Custom wrapper for NostrProvider that ensures relays are configured
const RelayInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Set relays in the settings store
    settingsStore.getState().setRelays(AFK_RELAYS);
  }, []);

  return <>{children}</>;
};

// Add NDK functionality to children components
const NDKConnector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ndk, setNdk, setIsNdkConnected } = useNostrContext();

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
        setNdk(ndkInstance);
        setIsNdkConnected(true);
      }).catch(err => {
        console.error('Failed to connect to relays', err);
        setIsNdkConnected(false);
      });

      // Cleanup on unmount
      return () => {
        // ndkInstance.disconnect();
      };
    }
  }, [ndk, setNdk, setIsNdkConnected]);

  return <>{children}</>;
};

// Wrap the entire providers tree in a client-side only component
const ClientProviders = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <StarknetProvider>
      <QueryClientProvider client={queryClient}>
        <TanstackProvider>
          <RelayInitializer>
            <NostrProvider>
              <AuthNostrProviderComponent />
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
};

// Export a dynamic version of the providers with SSR disabled
export default dynamic(() => Promise.resolve(ClientProviders), {
  ssr: false,
});
