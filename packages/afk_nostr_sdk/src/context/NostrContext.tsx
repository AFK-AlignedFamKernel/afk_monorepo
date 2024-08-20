import React, { createContext, useContext, useEffect, useState } from 'react';
import NDK, { NDKNip07Signer, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import { useAuth } from '../store/auth';
import { AFK_RELAYS } from "../utils/relay"
import { useSettingsStore } from '../store';
export type NostrContextType = {
  ndk: NDK;
  nip07Signer?:NDKNip07Signer
};
export const NostrContext = createContext<NostrContextType | null>(null);
export const NostrProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const privateKey = useAuth((state) => state.privateKey);
  const publicKey = useAuth((state) => state.publicKey);
  const isExtension = useAuth((state) => state.isExtension);
  const relays = useSettingsStore((state) => state.relays);

  const [ndk, setNdk] = useState<NDK>(
    new NDK({
      explicitRelayUrls: relays ?? AFK_RELAYS,
    }),
  );

  const nip07Signer = new NDKNip07Signer();
  const [ndkExtension, setNdkExtension] = useState<NDK>(
    new NDK({
      explicitRelayUrls: relays ?? AFK_RELAYS,
    }),
  );

  useEffect(() => {
    const newNdk = new NDK({
      explicitRelayUrls: relays ?? AFK_RELAYS,
      signer: privateKey ? new NDKPrivateKeySigner(privateKey) : isExtension ?  nip07Signer : undefined
    });

    newNdk.connect().then(() => {
      setNdk(newNdk);
    });
  }, [privateKey, isExtension]);

  return <NostrContext.Provider value={{ ndk , nip07Signer}}>{children}</NostrContext.Provider>;
};

export const useNostrContext = () => {
  const nostr = useContext(NostrContext);

  if (!nostr) {
    throw new Error('NostrContext must be used within a NostrProvider');
  }

  return nostr;
};
