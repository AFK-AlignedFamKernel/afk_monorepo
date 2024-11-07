import { mainnet, sepolia } from '@starknet-react/chains';
import {
  argent,
  braavos,
  publicProvider,
  StarknetConfig,
  useInjectedConnectors,
  voyager,
} from '@starknet-react/core';
import {
  ConnectorProvider as StarknetWCProvider,
  useArgentMobileConnector,
} from '@starknet-wc/react';
import { Platform } from 'react-native';

import { NETWORK_NAME, WALLET_CONNECT_ID } from '../constants/env';
import { RpcProviderProvider } from '../context/RpcProvider';
import { WalletQRModal } from '../modules/WalletQRModal';
import { providers } from '../services/provider';
import { kakarotConnectors } from "@starknet-react/kakarot";

export const StarknetReactProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const chain = {
    SN_MAIN: mainnet,
    SN_SEPOLIA: sepolia,
  }[NETWORK_NAME];

  const provider = providers(chain);
  const providerRpc = publicProvider();
  // const argentMobileConnector = useArgentMobileConnector();

  const { connectors: injected } = useInjectedConnectors({
    recommended: [argent(), braavos(),
    ...kakarotConnectors(providerRpc)

    ],
    includeRecommended: 'always',
    order: "alphabetical"
    // Randomize the order of the connectors.
    // order: "alphabetical",
  });

  return (
    <RpcProviderProvider provider={provider}>
      <StarknetConfig
        chains={[chain]}
        provider={providers}
        connectors={[
          ...(Platform.OS === 'web' ? injected : []),
          // argentMobileConnector({
          //   chain: NETWORK_NAME,
          //   wcProjectId: WALLET_CONNECT_ID,
          //   dappName: 'AFK',
          //   description: 'AFK Starknet dApp',
          //   url: 'https://afk-community.xyz',
          //   provider,
          // }),

        ]}
        explorer={voyager}
      >
        {children}
      </StarknetConfig>
    </RpcProviderProvider>
  );
};

export const StarknetProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <StarknetWCProvider modal={WalletQRModal}>
      <StarknetReactProvider>{children}</StarknetReactProvider>
    </StarknetWCProvider>
  );
};
