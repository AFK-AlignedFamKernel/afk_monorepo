import {webln} from '@getalby/sdk';
import NDK from '@nostr-dev-kit/ndk';
import React, {createContext, useContext, useEffect, useState} from 'react';

import {useSettingsStore} from '../store';
import {useAuth} from '../store/auth';
import {AFK_RELAYS} from '../utils/relay';

export type LightningContextType = {
  webLn?: webln.NostrWebLNProvider;
  nwcUrl?: string;
};
export const LightningContext = createContext<LightningContextType | null>(null);
export const LightningNetworkProvider: React.FC<React.PropsWithChildren> = ({children}) => {
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
  const [nostrWebLNState, setNostrWebLN] = useState<webln.NostrWebLNProvider | undefined>(
    undefined,
  );

  useEffect(() => {
    const connectWebLn = async () => {
      if (nwcUrl) {
        const nwc = new webln.NostrWebLNProvider({
          nostrWalletConnectUrl: nwcUrl,
        });
        await nwc.enable();
        setNostrWebLN(nwc);
      }
    };
    connectWebLn();
  }, [nwcUrl, ndk]);

  return (
    <LightningContext.Provider value={{nwcUrl, webLn: nostrWebLNState}}>
      {children}
    </LightningContext.Provider>
  );
};

export const useLightningContext = () => {
  const nostr = useContext(LightningContext);

  if (!nostr) {
    throw new Error('LightningContext must be used within a NostrProvider');
  }

  return nostr;
};
