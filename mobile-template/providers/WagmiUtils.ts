import {CreateConfigParameters} from 'wagmi';
import {
  arbitrum,
  aurora,
  avalanche,
  base,
  bsc,
  celo,
  gnosis,
  mainnet,
  optimism,
  polygon,
  sepolia,
  zora,
} from 'wagmi/chains';

export const chains = [
  mainnet,
  polygon,
  avalanche,
  arbitrum,
  bsc,
  optimism,
  gnosis,
  zora,
  base,
  celo,
  aurora,
  sepolia,
] as CreateConfigParameters['chains'];
