'use client';

import { CHAIN_ID, NETWORK_NAME } from '@/constants/misc';
import { mainnet, sepolia } from '@starknet-react/chains';
import {
  argent,
  braavos,
  Connector,
  publicProvider,
  StarknetConfig,
  useInjectedConnectors,
  voyager,
} from '@starknet-react/core';
import { InjectedConnector } from 'starknetkit/injected';
import { ArgentMobileConnector } from 'starknetkit/argentMobile';
import { WebWalletConnector } from 'starknetkit/webwallet';
import { ControllerConnector } from '@cartridge/connector';
import { RpcProvider } from 'starknet';

export function StarknetProvider({ children }: { children: React.ReactNode }) {
  const chains = [mainnet, sepolia];
  
  // Create a custom provider with API key
  const provider = () => {
    return new RpcProvider({
      nodeUrl: process.env.NEXT_PUBLIC_STARKNET_RPC_URL || 'https://starknet-sepolia.infura.io/v3/',
      headers: {
        'x-api-key': process.env.NEXT_PUBLIC_STARKNET_API_KEY || '',
      },
    });
  };

  const connectors = [
    new InjectedConnector({
      options: { id: "argentX", name: "Argent X" },
    }),
    new InjectedConnector({
      options: { id: "braavos", name: "Braavos" },
    }),
    new WebWalletConnector({ url: "https://web.argent.xyz" }),
    new ArgentMobileConnector(),
  ]

  return (
    <StarknetConfig
      chains={chains}
      provider={provider}
      explorer={voyager}
      connectors={connectors as Connector[]}
      autoConnect
    >
      {children}
    </StarknetConfig>
  );
}

// 'use client';

// import React from 'react';
// import { StarknetConfig } from '@starknet-react/core';
// // import { StarknetkitConnector } from 'starknetkit';
// import { sepolia } from '@starknet-react/chains';
// import { Provider } from 'starknet';

// const connectors = [
//     {
//       chains: [sepolia],
//       projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '',
//     },
// ];

// const provider = new Provider({ rpc: { nodeUrl: 'https://sepolia.starknet.io' } });

// interface StarknetProvidersProps {
//   children: React.ReactNode;
// }

// export const StarknetProviders: React.FC<StarknetProvidersProps> = ({ children }) => {
//   return (
//     <StarknetConfig 
//       connectors={connectors} 
//       autoConnect
//       chains={[sepolia]}
//       provider={provider}
//     >
//       {children}
//     </StarknetConfig>
//   );
// }; 