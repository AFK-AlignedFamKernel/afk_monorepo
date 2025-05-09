import React from 'react';
import NDK, {NDKNip07Signer, NDKNwc, NDKPrivateKeySigner} from '@nostr-dev-kit/ndk';
import NDKWallet, {NDKCashuWallet} from '@nostr-dev-kit/ndk-wallet';
import {createContext, useContext, useEffect, useState} from 'react';

import {useSettingsStore} from '../store';
import {useAuth} from '../store/auth';
import {AFK_RELAYS} from '../utils/relay';

// Create a separate type for the NDK instance to avoid direct type conflicts
type NDKInstance = NDK;

export type NostrContextType = {
  ndk: NDKInstance;
  nip07Signer?: NDKNip07Signer;
  nwcNdk?: NDKNwc;
  ndkCashuWallet?: NDKCashuWallet;
  ndkWallet?: NDKWallet;
};

export const NostrContext = createContext<NostrContextType | null>(null);

export const NostrProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  const privateKey = useAuth((state) => state.privateKey);
  const publicKey = useAuth((state) => state.publicKey);
  const isExtension = useAuth((state) => state.isExtension);
  const nwcUrl = useAuth((state) => state.nwcUrl);
  const relays = useSettingsStore((state) => state.relays);

  const [ndk, setNdk] = useState<NDKInstance>(
    new NDK({
      explicitRelayUrls: relays ?? AFK_RELAYS,
    }),
  );

  // Use any type to avoid type incompatibility issues
  const [ndkCashuWallet, setNDKCashuWallet] = useState<any>(
    new NDKCashuWallet(ndk as any),
  );
  const [ndkWallet, setNDKWallet] = useState<any>(new NDKWallet(ndk as any));

  const [nwcNdk, setNWCNdk] = useState<NDKNwc | undefined>(undefined);

  const nip07Signer = new NDKNip07Signer();
  const [ndkExtension, setNdkExtension] = useState<NDKInstance>(
    new NDK({
      explicitRelayUrls: relays ?? AFK_RELAYS,
    }),
  );

  useEffect(() => {
    const newNdk = new NDK({
      explicitRelayUrls: relays ?? AFK_RELAYS,
      signer: privateKey
        ? new NDKPrivateKeySigner(privateKey)
        : isExtension
        ? nip07Signer
        : undefined,
    });
    console.log('test');

    newNdk.connect().then(() => {
      setNdk(newNdk);
    });

    // Use any type to avoid type incompatibility issues
    const ndkCashuWalletNew = new NDKCashuWallet(ndk as any);
    setNDKCashuWallet(ndkCashuWalletNew);

    const ndkNewWallet = new NDKWallet(ndk as any);
    setNDKWallet(ndkNewWallet);
  }, [privateKey, isExtension]);

  useEffect(() => {
    if (nwcUrl) {
      ndk.nwc(nwcUrl).then((res) => {
        setNWCNdk(res);
      });
    }
  }, [nwcUrl, ndk]);

  return (
    <NostrContext.Provider value={{ndk, nip07Signer, nwcNdk, ndkWallet, ndkCashuWallet}}>
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
