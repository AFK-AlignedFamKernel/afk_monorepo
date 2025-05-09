'use client';

import '@rainbow-me/rainbowkit/styles.css';

import { ChakraProvider, ColorModeProvider } from '@chakra-ui/react';
// import {getDefaultConfig, RainbowKitProvider} from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import {Chain} from 'viem';
// import {createConfig, http} from 'wagmi';
// import {WagmiProvider} from 'wagmi';
// import {mainnet, sepolia} from 'wagmi/chains';

import StarknetProvider from '@/context/StarknetProvider';
import { NostrProvider, TanstackProvider } from 'afk_nostr_sdk';

import theme from '../theme'; // Import your custom theme

// const kakarotEvm: Chain = {
//   id: 1802203764,
//   name: 'Kakarot Sepolia',
//   // network: "Scroll Sepolia Testnet",
//   // iconUrl: '/assets/scroll.svg',
//   // iconBackground: '#fff',
//   nativeCurrency: {
//     decimals: 18,
//     name: 'Ethereum',
//     symbol: 'ETH ',
//   },
//   rpcUrls: {
//     public: {http: ['https://sepolia-rpc.kakarot.org']},
//     default: {http: ['https://sepolia-rpc.kakarot.org']},
//   },
//   blockExplorers: {
//     default: {name: 'Explorer', url: 'https://sepolia.kakarotscan.org/'},
//     etherscan: {name: 'Explorer', url: 'https://sepolia.kakarotscan.org/'},
//   },
//   // testnet: true,
// };

// export const CHAINS_CONFIG = [mainnet, sepolia, kakarotEvm];
// export const TRANSPORTS = {
//   [mainnet.id]: http(),
//   [sepolia.id]: http(),
//   [kakarotEvm.id]: http(),
// };
// export const config = createConfig({
//   chains: [mainnet, sepolia, kakarotEvm],
//   transports: TRANSPORTS,
//   multiInjectedProviderDiscovery: false,
// });

// const configRainbow = getDefaultConfig({
//   appName: 'My RainbowKit App',
//   projectId: 'YOUR_PROJECT_ID',
//   chains: [mainnet, sepolia],
//   transports: {
//     [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/...'),
//     [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/...'),
//   },
// });


export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();

  return (
    <>
      <ChakraProvider theme={theme}>
        <ColorModeProvider
          options={{
            initialColorMode: theme.config.initialColorMode,
            useSystemColorMode: theme.config.useSystemColorMode,
          }}
        >
          <StarknetProvider>
            {/* <WagmiProvider config={config} reconnectOnMount={false}> */}
            <QueryClientProvider client={queryClient}>
              <TanstackProvider>
                <NostrProvider>
                  {children}
                </NostrProvider>
              </TanstackProvider>
            </QueryClientProvider>
            {/* </WagmiProvider> */}
          </StarknetProvider>
        </ColorModeProvider>
      </ChakraProvider>
    </>
  );
}
