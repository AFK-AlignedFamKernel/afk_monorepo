'use client';
// const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS; // Replace with your actual tracking ID

// import '@rainbow-me/rainbowkit/styles.css';
import {ChakraProvider} from '@chakra-ui/react';
// import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
// import { Chain } from 'viem';
// import { createConfig, http } from 'wagmi';
// import { WagmiProvider } from 'wagmi';
// import { mainnet, sepolia } from 'wagmi/chains';

import StarknetProvider from '@/context/StarknetProvider';
import theme from '../theme'; // Import your custom theme

// import {TanstackProvider} from 'afk_nostr_sdk';
// import {NostrProvider} from 'afk_nostr_sdk';

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
//     public: { http: ['https://sepolia-rpc.kakarot.org'] },
//     default: { http: ['https://sepolia-rpc.kakarot.org'] },
//   },
//   blockExplorers: {
//     default: { name: 'Explorer', url: 'https://sepolia.kakarotscan.org/' },
//     etherscan: { name: 'Explorer', url: 'https://sepolia.kakarotscan.org/' },
//   },
//   // testnet: true,
// };

// export const config = createConfig({
//   chains: [mainnet, sepolia, kakarotEvm],
//   transports: {
//     [mainnet.id]: http(),
//     [sepolia.id]: http(),
//     [kakarotEvm.id]: http(),
//   },
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

const queryClient = new QueryClient();

// const system = createSystem(defaultConfig, configChakra)
export default function Providers({children}: {children: React.ReactNode}) {
  // const router = useRouter();
  // useEffect(() => {
  //   const handleRouteChange = (url: string) => {
  //     if (typeof window !== 'undefined') {
  //       window.gtag('config', GA_TRACKING_ID, {
  //         page_path: url,
  //       });
  //     }
  //   };
  //   router?.events?.on('routeChangeComplete', handleRouteChange);
  //   return () => {
  //     router?.events?.off('routeChangeComplete', handleRouteChange);
  //   };
  // }, [router]);

  return (
    <ChakraProvider theme={theme}>
      <StarknetProvider>
        <QueryClientProvider client={queryClient}>
          {/* <WagmiProvider config={config}> */}
          {/* <RainbowKitProvider>{children}</RainbowKitProvider> */}
          {children}
          {/* </QueryClientProvider> */}
          {/* </WagmiProvider> */}
        </QueryClientProvider>
      </StarknetProvider>
    </ChakraProvider>
  );
}
