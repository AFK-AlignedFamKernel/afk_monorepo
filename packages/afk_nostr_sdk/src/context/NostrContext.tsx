import NDK, {NDKNip07Signer, NDKNwc, NDKPrivateKeySigner} from '@nostr-dev-kit/ndk';
import React, {createContext, useContext, useEffect, useState} from 'react';

import {useSettingsStore} from '../store';
import {useAuth} from '../store/auth';
import {AFK_RELAYS} from '../utils/relay';
import NDKWallet, {NDKCashuWallet} from '@nostr-dev-kit/ndk-wallet';

export type NostrContextType = {
  ndk: NDK;
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

  const [ndk, setNdk] = useState<NDK>(
    new NDK({
      explicitRelayUrls: relays ?? AFK_RELAYS,
    }),
  );

  const [ndkCashuWallet, setNDKCashuWallet] = useState<NDKCashuWallet | undefined>(
    new NDKCashuWallet(ndk),
  );
  const [ndkWallet, setNDKWallet] = useState<NDKWallet | undefined>(new NDKWallet(ndk));

  const [nwcNdk, setNWCNdk] = useState<NDKNwc | undefined>(undefined);

  const nip07Signer = new NDKNip07Signer();
  const [ndkExtension, setNdkExtension] = useState<NDK>(
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

    newNdk.connect().then(() => {
      setNdk(newNdk);
    });

    const ndkCashuWalletNew = new NDKCashuWallet(ndk);
    setNDKCashuWallet(ndkCashuWalletNew);

    const ndkNewWallet = new NDKWallet(ndk);
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
