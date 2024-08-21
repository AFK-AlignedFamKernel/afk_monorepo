'use client';
// import { CacheProvider } from '@chakra-ui/next-js';
import {ChakraProvider, ColorModeScript} from '@chakra-ui/react';
import {TanstackProvider} from 'afk_nostr_sdk';
import {NostrProvider} from 'afk_nostr_sdk';

import theme from './theme/theme';
export default function Providers({children}: {children: React.ReactNode}) {
  return (
    <ChakraProvider theme={theme}>
      <NostrProvider>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <TanstackProvider>{children}</TanstackProvider>
      </NostrProvider>
    </ChakraProvider>
  );
}
