'use client';

import '@rainbow-me/rainbowkit/styles.css';

import {ChakraProvider} from '@chakra-ui/react';
import {RainbowKitProvider} from '@rainbow-me/rainbowkit';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Chain} from 'viem';
import {createConfig, http} from 'wagmi';
import {WagmiProvider} from 'wagmi';
import {mainnet, sepolia} from 'wagmi/chains';

import StarknetProvider from '@/context/StarknetProvider';

const kakarotEvm: Chain = {
  id: 1802203764,
  name: 'Kakarot Sepolia',
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
};

export const config = createConfig({
  chains: [mainnet, sepolia, kakarotEvm],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [kakarotEvm.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function Providers({children}: {children: React.ReactNode}) {
  return (
    <ChakraProvider>
      <StarknetProvider>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>{children}</RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </StarknetProvider>
    </ChakraProvider>
  );
}
