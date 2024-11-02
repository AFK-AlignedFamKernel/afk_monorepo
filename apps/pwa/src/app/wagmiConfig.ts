import {getDefaultConfig} from '@rainbow-me/rainbowkit';
import {mainnet, sepolia} from 'wagmi/chains';
import {http} from 'wagmi';

const kakarotEvm = {
  id: 1802203764,
  name: 'Kakarot Sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: {http: ['https://sepolia-rpc.kakarot.org']},
    default: {http: ['https://sepolia-rpc.kakarot.org']},
  },
  blockExplorers: {
    default: {name: 'Explorer', url: 'https://sepolia.kakarotscan.org/'},
  },
};

export const config = getDefaultConfig({
  appName: 'AFK Community',
  projectId: process.env.NEXT_PUBLIC_WC_ID || '',
  chains: [mainnet, sepolia, kakarotEvm],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [kakarotEvm.id]: http(),
  },
});