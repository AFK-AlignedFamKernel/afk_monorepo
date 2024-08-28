'use client';

import StarknetProvider from '@/context/StarknetProvider';

// import {TanstackProvider} from 'afk_nostr_sdk';
// import {NostrProvider} from 'afk_nostr_sdk';
export default function Providers({children}: {children: React.ReactNode}) {
  return (
    <>
      <StarknetProvider>
        {/* <NostrProvider> */}
        {/* <TanstackProvider> */}
        {children}
        {/* </TanstackProvider>
     </NostrProvider> */}
      </StarknetProvider>
    </>
  );
}
