'use client';

import '@rainbow-me/rainbowkit/styles.css';

import {ChakraProvider, ColorModeProvider} from '@chakra-ui/react';
// import {EthereumWalletConnectors} from '@dynamic-labs/ethereum';
// import {DynamicContextProvider, DynamicWidget} from '@dynamic-labs/sdk-react-core';
// import {StarknetWalletConnectors} from '@dynamic-labs/starknet';
// import {DynamicWagmiConnector} from '@dynamic-labs/wagmi-connector';
import {getDefaultConfig, RainbowKitProvider} from '@rainbow-me/rainbowkit';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Chain} from 'viem';
import {createConfig, http} from 'wagmi';
import {WagmiProvider} from 'wagmi';
import {mainnet, sepolia} from 'wagmi/chains';

// import { BitcoinWalletConnectors } from "@dynamic-labs/bitcoin";
import StarknetProvider from '@/context/StarknetProvider';

import theme from '../theme'; // Import your custom theme


import { ArgentTMA, SessionAccountInterface } from "@argent/tma-wallet";

export const argentTMA = ArgentTMA.init({
  environment: "sepolia", // "sepolia" | "mainnet" (not supperted yet)
  appName: "My TG Mini Test Dapp", // Your Telegram app name
  appTelegramUrl: "https://t.me/my_telegram_bot/app_name", // Your Telegram app URL
  sessionParams: {
    allowedMethods: [
      // List of contracts/methods allowed to be called by the session key
      {
        contract:
          "0x036133c88c1954413150db74c26243e2af77170a4032934b275708d84ec5452f",
        selector: "increment",
      }
    ],
    validityDays: 90 // session validity (in days) - default: 90
  },
});


// import {TanstackProvider} from 'afk_nostr_sdk';
// import {NostrProvider} from 'afk_nostr_sdk';

const kakarotEvm: Chain = {
  id: 1802203764,
  name: 'Kakarot Sepolia',
  // network: "Scroll Sepolia Testnet",
  // iconUrl: '/assets/scroll.svg',
  // iconBackground: '#fff',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH ',
  },
  rpcUrls: {
    public: {http: ['https://sepolia-rpc.kakarot.org']},
    default: {http: ['https://sepolia-rpc.kakarot.org']},
  },
  blockExplorers: {
    default: {name: 'Explorer', url: 'https://sepolia.kakarotscan.org/'},
    etherscan: {name: 'Explorer', url: 'https://sepolia.kakarotscan.org/'},
  },
  // testnet: true,
};

export const CHAINS_CONFIG = [mainnet, sepolia, kakarotEvm];
export const TRANSPORTS = {
  [mainnet.id]: http(),
  [sepolia.id]: http(),
  [kakarotEvm.id]: http(),
};
export const config = createConfig({
  chains: [mainnet, sepolia, kakarotEvm],
  transports: TRANSPORTS,
  multiInjectedProviderDiscovery: false,
});

const configRainbow = getDefaultConfig({
  appName: 'My RainbowKit App',
  projectId: 'YOUR_PROJECT_ID',
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/...'),
    [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/...'),
  },
});

const queryClient = new QueryClient();

export default function Providers({children}: {children: React.ReactNode}) {
  return (
    <>
      <ChakraProvider theme={theme}>
        <ColorModeProvider
          options={{
            initialColorMode: theme.config.initialColorMode,
            useSystemColorMode: theme.config.useSystemColorMode,
          }}
        >
          {/* <DynamicContextProvider
            settings={{
              environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID ?? '',
              walletConnectors: [EthereumWalletConnectors, StarknetWalletConnectors],
            }}
          > */}
          <StarknetProvider>
            <WagmiProvider config={config} reconnectOnMount={false}>
              <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>{children}</RainbowKitProvider>
                {/* <DynamicWagmiConnector>
                    <DynamicWidget />
                  </DynamicWagmiConnector> */}
              </QueryClientProvider>
            </WagmiProvider>
          </StarknetProvider>
          {/* </DynamicContextProvider> */}
        </ColorModeProvider>
      </ChakraProvider>
    </>
  );
}
