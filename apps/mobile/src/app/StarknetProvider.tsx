import {mainnet, sepolia} from '@starknet-react/chains';
import {
  argent,
  braavos,
  StarknetConfig,
  useInjectedConnectors,
  voyager,
} from '@starknet-react/core';
import {Platform} from 'react-native';
import {ArgentMobileConnector, isInArgentMobileAppBrowser} from 'starknetkit/argentMobile';
import {WebWalletConnector} from 'starknetkit/webwallet';

import {CHAIN_ID, NETWORK_NAME} from '../constants/env';
import {RpcProviderProvider} from '../context/RpcProvider';
// import {WalletQRModal} from '../modules/WalletQRModal';
import {providers} from '../services/provider';

export const StarknetReactProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  const chain = {
    SN_MAIN: mainnet,
    SN_SEPOLIA: sepolia,
  }[NETWORK_NAME];

  const provider = providers(chain);
  // const providerRpc = publicProvider();
  // const argentMobileConnector = useArgentMobileConnector();

  const recommended =
    Platform.OS === 'web'
      ? [
          argent(),
          braavos(),
          // ...kakarotConnectors(providerRpc)
        ]
      : [argent(), braavos()];

  const {connectors: injected} = useInjectedConnectors({
    recommended,
    includeRecommended: 'always',
    order: 'alphabetical',
    // Randomize the order of the connectors.
    // order: "alphabetical",
  });
  const connectorInjected = injected;

  const mobileConnector = isInArgentMobileAppBrowser()
    ? [
        ArgentMobileConnector.init({
          options: {
            dappName: 'AFK Dapp',
            projectId: process.env.EXPO_PUBLIC_WC_ID ?? 'example-project-id',
            url: typeof window !== 'undefined' ? window.location.href : '',
            chainId: CHAIN_ID as any,
          },
          inAppBrowserOptions: {},
        }),
      ]
    : [
        ...connectorInjected,
        ArgentMobileConnector.init({
          options: {
            url: typeof window !== 'undefined' ? window.location.href : '',
            dappName: 'AFK Dapp',
            chainId: CHAIN_ID as any,
            projectId: process.env.EXPO_PUBLIC_WC_ID ?? 'example-project-id',
          },
        }),
        new WebWalletConnector({url: 'https://web.argent.xyz'}),
      ];

  return (
    <RpcProviderProvider provider={provider}>
      <StarknetConfig
        chains={[chain]}
        provider={providers}
        autoConnect
        connectors={mobileConnector}
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
