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
// import {ConnectorProvider as StarknetWCProvider} from '@starknet-wc/react';
import {Platform} from 'react-native';
// import { ArgentMobileConnector, isInArgentMobileAppBrowser } from "starknetkit/argentMobile" 
// import { InjectedConnector } from "starknetkit/injected"
// import { WebWalletConnector } from "starknetkit/webwallet"

import {NETWORK_NAME} from '../constants/env';
import {RpcProviderProvider} from '../context/RpcProvider';
// import {WalletQRModal} from '../modules/WalletQRModal';
import {providers} from '../services/provider';

import { ArgentMobileConnector, isInArgentMobileAppBrowser } from "starknetkit-next/argentMobile" 
import { InjectedConnector } from "starknetkit-next/injected"
import { WebWalletConnector } from "starknetkit-next/webwallet"


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


      const chains = [mainnet, sepolia]
    // const connectors = [
    //   new InjectedConnector({ options: { id: "braavos", name: "Braavos" }}),
    //   new InjectedConnector({ options: { id: "argentX", name: "Argent X" }}),
    //   new WebWalletConnector({ url: "https://web.argent.xyz" }),
    //   new ArgentMobileConnector(),
    // ]

    
  const connectors = isInArgentMobileAppBrowser() ? [
    ArgentMobileConnector.init({
      options: {
        dappName: "AFK Dapp",
        projectId: process.env.EXPO_PUBLIC_WC_ID ??"example-project-id",
      },
      inAppBrowserOptions: {},
    })
  ] : [
    new InjectedConnector({ options: { id: "braavos", name: "Braavos" }}),
    new InjectedConnector({ options: { id: "argentX", name: "Argent X" }}),
    new WebWalletConnector({ url: "https://web.argent.xyz" }),
    ArgentMobileConnector.init({
      options: {
        dappName: "AFK Dapp",
        projectId: process.env.EXPO_PUBLIC_WC_ID ?? "example-project-id",
      }
    })
  ]
 

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
        connectors={connectors}
        // connectors={[...(Platform.OS === 'web' ? injected : [])]}
        explorer={voyager}
      >
        {children}
      </StarknetConfig>
    </RpcProviderProvider>
  );
};

export const StarknetProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  return (
    // <StarknetWCProvider modal={WalletQRModal}>
      <StarknetReactProvider>{children}</StarknetReactProvider>
    // </StarknetWCProvider>
  );
};
