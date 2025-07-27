import React from 'react';
import NDK, { NDKNip07Signer, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import { NDKCashuWallet, NDKWallet, NDKNWCWallet } from '@nostr-dev-kit/ndk-wallet';
import { createContext, useContext, useEffect, useState } from 'react';

import { useSettingsStore } from '../store';
import { useAuth } from '../store/auth';
import { AFK_RELAYS } from '../utils/relay';
import { checkIsConnected } from '../hooks/connect';

// Create a separate type for the NDK instance to avoid direct type conflicts
type NDKInstance = NDK;

export type NostrContextType = {
  ndk: NDKInstance;
  nip07Signer?: NDKNip07Signer;
  nwcNdk?: NDKNWCWallet;
  ndkCashuWallet?: NDKCashuWallet;
  ndkWallet?: NDKWallet;
  setNdk: (ndk: NDKInstance) => void;
  isNdkConnected: boolean;
  setIsNdkConnected: (isNdkConnected: boolean) => void;
};

export const NostrContext = createContext<NostrContextType | null>(null);

export const NostrProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const privateKey = useAuth((state) => state.privateKey);
  const publicKey = useAuth((state) => state.publicKey);
  const isExtension = useAuth((state) => state.isExtension);
  const nwcUrl = useAuth((state) => state.nwcUrl);
  const relays = useSettingsStore((state) => state.relays);
  const setIsConnected = useSettingsStore((state) => state.setIsConnected);
  const nip07Signer = new NDKNip07Signer();
  const [isNdkConnected, setIsNdkConnected] = useState(false);
  const [ndk, setNdk] = useState<NDKInstance>(
    new NDK({
      explicitRelayUrls: relays ?? AFK_RELAYS,
      signer: isExtension ?
        nip07Signer :
        privateKey
          ? new NDKPrivateKeySigner(privateKey)
          : isExtension
            ? nip07Signer
            : undefined,
    }),
  );

  // Use any type to avoid type incompatibility issues
  const [ndkCashuWallet, setNDKCashuWallet] = useState<any>(
    new NDKCashuWallet(ndk as any),
  );
  const [ndkWallet, setNDKWallet] = useState<any>();
  // const [ndkWallet, setNDKWallet] = useState<any>(new NDKWalletNWC(ndk as any));

  const [nwcNdk, setNWCNdk] = useState<NDKNWCWallet | undefined>(undefined);

  const [ndkExtension, setNdkExtension] = useState<NDKInstance>(
    new NDK({
      explicitRelayUrls: relays ?? AFK_RELAYS,
    }),
  );

  useEffect(() => {
    const newNdk = new NDK({
      explicitRelayUrls: relays ?? AFK_RELAYS,
      signer: isExtension ? nip07Signer : privateKey
        ? new NDKPrivateKeySigner(privateKey)
        : isExtension
          ? nip07Signer
          : undefined,


      // signer: privateKey
      // ? new NDKPrivateKeySigner(privateKey)
      // : isExtension
      //   ? nip07Signer
      //   : undefined,
    });

    newNdk.connect().then(() => {
      setNdk(newNdk);
      setIsNdkConnected(true);
    }).catch((err) => {
      console.error('Failed to connect to relays', err);
      setIsNdkConnected(false);
    });

    // Use any type to avoid type incompatibility issues
    const ndkCashuWalletNew = new NDKCashuWallet(newNdk as any);
    setNDKCashuWallet(ndkCashuWalletNew);

    // newNdk.wallet= ndkCashuWalletNew;

    // const ndkNewWallet = new NDKWalletNWC(ndk as any);
    // setNDKWallet(ndkNewWallet);
  }, [privateKey, isExtension, relays]);

  useEffect(() => {
    if (isExtension) {
      const newNdk = new NDK({
        explicitRelayUrls: relays ?? AFK_RELAYS,
        signer: nip07Signer,
      });

      newNdk.connect().then(() => {
        setNdk(newNdk);
        setIsNdkConnected(true);
      }).catch((err) => {
        console.error('Failed to connect to relays', err);
        setIsNdkConnected(false);
      });
    }
  }, [isExtension]);

  useEffect(() => {
    if (nwcUrl) {
      // ndk.nwc(nwcUrl).then((res) => {
      //   setNWCNdk(res);
      // });
    }
  }, [nwcUrl, ndk]);

  useEffect(() => {
    const checkConnection = () => {
      const connected = ndk.pool.connectedRelays().length > 0;
      setIsConnected(connected);
    };

    const interval = setInterval(checkConnection, 1000 * 60); // Check every minute

    // Initial check
    checkConnection();

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [ndk, setIsConnected]);

  useEffect(() => {
    checkIsConnected(ndk).then((res) => {
      setIsNdkConnected(true);
    }).catch((err) => {
      setIsNdkConnected(false);
    });
  }, [ndk]);

  return (
    <NostrContext.Provider
      value={{ ndk, nip07Signer, nwcNdk, ndkWallet, ndkCashuWallet, setNdk, isNdkConnected, setIsNdkConnected }}>
      {children}
    </NostrContext.Provider>
  );
};

export const useNostrContext = () => {
  const nostr = useContext(NostrContext);

  if (!nostr) {
    throw new Error('NostrContext must be used within a NostrProvider');
  }

  return nostr;
};
