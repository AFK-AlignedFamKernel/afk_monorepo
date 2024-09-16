
import { providers } from '../services/provider';
import '@rainbow-me/rainbowkit/styles.css';

import {
    getDefaultConfig,
    RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
    mainnet,
    polygon,
    optimism,
    arbitrum,
    base,
} from 'wagmi/chains';
import {
    QueryClientProvider,
    QueryClient,
} from "@tanstack/react-query";
import { Chain } from "viem";

const kakarotEvm: Chain = {
    id: 1802203764,
    name: "Kakarot Sepolia",
    // network: "Scroll Sepolia Testnet",
    // iconUrl: '/assets/scroll.svg',
    // iconBackground: '#fff',
    nativeCurrency: {
        decimals: 18,
        name: "Ethereum",
        symbol: "ETH ",
    },
    rpcUrls: {
        public: { http: ["https://sepolia-rpc.kakarot.org"] },
        default: { http: ["https://sepolia-rpc.kakarot.org"] },
    },
    blockExplorers: {
        default: { name: "Explorer", url: "https://sepolia.kakarotscan.org/" },
        etherscan: { name: "Explorer", url: "https://sepolia.kakarotscan.org/" },
    },
    // testnet: true,
};


const config = getDefaultConfig({
    appName: 'My RainbowKit App',
    projectId: 'YOUR_PROJECT_ID',
    chains: [mainnet, polygon, optimism, arbitrum, base],
    ssr: true, // If your dApp uses server side rendering (SSR)
});
const queryClient = new QueryClient();
export const EVMProvider: React.FC<React.PropsWithChildren> = ({ children }) => {

    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>
                    {/* Your App */}
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
};
