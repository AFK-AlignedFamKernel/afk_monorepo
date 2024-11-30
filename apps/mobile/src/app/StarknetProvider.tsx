import {mainnet, sepolia} from '@starknet-react/chains';
import {
  argent,
  braavos,
  publicProvider,
  StarknetConfig,
  useInjectedConnectors,
  voyager,
} from '@starknet-react/core';
import {kakarotConnectors} from '@starknet-react/kakarot';
import {ConnectorProvider as StarknetWCProvider} from '@starknet-wc/react';
import {Platform} from 'react-native';

import {NETWORK_NAME} from '../constants/env';
import {RpcProviderProvider} from '../context/RpcProvider';
import {WalletQRModal} from '../modules/WalletQRModal';
import {providers} from '../services/provider';

export const StarknetReactProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  const chain = {
    SN_MAIN: mainnet,
    SN_SEPOLIA: sepolia,
  }[NETWORK_NAME];

  const provider = providers(chain);
  const providerRpc = publicProvider();
  // const argentMobileConnector = useArgentMobileConnector();

  const recommended =
    Platform.OS === 'web'
      ? [argent(), braavos(), ...kakarotConnectors(providerRpc)]
      : [argent(), braavos()];

  const {connectors: injected} = useInjectedConnectors({
    recommended,
    includeRecommended: 'always',
    order: 'alphabetical',
    // Randomize the order of the connectors.
    // order: "alphabetical",
  });

  return (
    <RpcProviderProvider provider={provider}>
      <StarknetConfig
        chains={[chain]}
        provider={providers}
        autoConnect
        connectors={[...(Platform.OS === 'web' ? injected : [])]}
        explorer={voyager}
      >
        {children}
      </StarknetConfig>
    </RpcProviderProvider>
  );
};

export const StarknetProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  return (
    <StarknetWCProvider modal={WalletQRModal}>
      <StarknetReactProvider>{children}</StarknetReactProvider>
    </StarknetWCProvider>
  );
};
