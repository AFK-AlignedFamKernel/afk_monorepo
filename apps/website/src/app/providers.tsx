'use client';

import {NostrProvider} from 'afk_nostr_sdk/context/NostrContext';
import {TanstackProvider} from 'afk_nostr_sdk/context/TanstackProvider';

export default function Providers({children}: {children: React.ReactNode}) {
  return (
    <NostrProvider>
      <TanstackProvider>{children}</TanstackProvider>
    </NostrProvider>
  );
}
