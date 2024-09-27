import '@walletconnect/react-native-compat';

import {authConnector} from '@reown/appkit-auth-wagmi-react-native';
import {createAppKit, defaultWagmiConfig} from '@reown/appkit-wagmi-react-native';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
// import { siweConfig } from './SiweUtils';
import * as Clipboard from 'expo-clipboard';
import {Chain} from 'viem';
import {WagmiProvider} from 'wagmi';
import {mainnet, sepolia} from 'wagmi/chains';

const queryClient = new QueryClient();

// 1. Get projectId at https://cloud.reown.com
const projectId = process.env.EXPO_PUBLIC_WC_ID ?? '';

// 2. Create config
const metadata = {
  name: 'AppKit RN',
  description: 'AppKit RN Example',
  url: 'https://reown.com/appkit',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
  redirect: {
    native: 'YOUR_APP_SCHEME://',
    universal: 'YOUR_APP_UNIVERSAL_LINK.com',
  },
};

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

const clipboardClient = {
  setString: async (value: string) => {
    await Clipboard.setStringAsync(value);
  },
};
const auth = authConnector({projectId, metadata});
const chains = [mainnet, sepolia, kakarotEvm] as const;
const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  extraConnectors: [auth],
});

// 3. Create modal
createAppKit({
  projectId,
  wagmiConfig,
  defaultChain: kakarotEvm, // Optional
  // siweConfig,
  enableAnalytics: false, // Optional - defaults to your Cloud configuration
});

// const config = getDefaultConfig({
//     appName: 'My RainbowKit App',
//     projectId: projectId,
//     chains: [mainnet, polygon, optimism, arbitrum, base],
//     ssr: true, // If your dApp uses server side rendering (SSR)
// });
export const EVMProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {/* <RainbowKitProvider> */}
        {/* Your App */}
        {children}
        {/* </RainbowKitProvider> */}
      </QueryClientProvider>
    </WagmiProvider>
  );
};
