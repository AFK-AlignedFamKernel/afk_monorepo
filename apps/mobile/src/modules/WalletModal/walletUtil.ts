/* eslint-disable @typescript-eslint/no-var-requires */
/**Inspired from uniswap */
// Import wallet icons
const COINBASE_ICON = require('../../../assets/wallets/coinbase-icon.svg');
const METAMASK_ICON = require('../../../assets/wallets/metamask-icon.svg');
const PHANTOM_ICON = require('../../../assets/wallets/phantom.png');
const WALLET_CONNECT_ICON = require('../../../assets/wallets/walletconnect-icon.svg');
const GNOSIS_ICON = require('../../../assets/wallets/gnosis.png');
const INJECTED_LIGHT_ICON = require('../../../assets/wallets/browser-wallet-light.svg');
import {useMemo} from 'react';
import {Platform} from 'react-native';
import {createConnector, useConnect} from 'wagmi';
import {Connector} from 'wagmi';
import {injected} from 'wagmi/connectors';

type ConnectorID = (typeof CONNECTION)[keyof typeof CONNECTION];

const SHOULD_THROW = {shouldThrow: true} as const;
// Define connection constants
const CONNECTION = {
  WALLET_CONNECT_CONNECTOR_ID: 'walletConnect',
  INJECTED_CONNECTOR_ID: 'injected',
  COINBASE_SDK_CONNECTOR_ID: 'coinbaseWalletSDK',
  COINBASE_RDNS: 'com.coinbase.wallet',
  METAMASK_RDNS: 'io.metamask',
  METAMASK_CONNECTOR_ID: 'metaMaskSDK',
  PHANTOM_CONNECTOR_ID: 'app.phantom',
  SAFE_CONNECTOR_ID: 'safe',
  INJECTED_CONNECTOR_TYPE: 'injected',
} as const;

// Define icon override map
export const CONNECTOR_ICON_OVERRIDE_MAP: {[id: string]: any} = {
  [CONNECTION.METAMASK_RDNS]: METAMASK_ICON,
  [CONNECTION.COINBASE_SDK_CONNECTOR_ID]: COINBASE_ICON,
  [CONNECTION.WALLET_CONNECT_CONNECTOR_ID]: WALLET_CONNECT_ICON,
  [CONNECTION.PHANTOM_CONNECTOR_ID]: PHANTOM_ICON,
  [CONNECTION.SAFE_CONNECTOR_ID]: GNOSIS_ICON,
};

export const walletTypeToAmplitudeWalletType = (connectionType?: string) => {
  switch (connectionType) {
    case 'injected': {
      return 'Browser Extension';
    }
    case 'walletConnect': {
      return 'Wallet Connect';
    }
    case 'coinbaseWallet': {
      return 'Coinbase Wallet';
    }
    case 'uniswapWalletConnect': {
      return 'Wallet Connect';
    }
    default: {
      return connectionType ?? 'Network';
    }
  }
};

export function injectedWithFallback() {
  return createConnector((config) => {
    const injectedConnector = injected()(config);

    return {
      ...injectedConnector,
      connect(...params) {
        if (!window.ethereum) {
          window.open('https://metamask.io/', 'inst_metamask');
        }
        return injectedConnector.connect(...params);
      },
      get icon() {
        return !window.ethereum || window.ethereum?.isMetaMask
          ? METAMASK_ICON
          : INJECTED_LIGHT_ICON;
      },
      get name() {
        return !window.ethereum
          ? 'Install MetaMask'
          : window.ethereum?.isMetaMask
          ? 'MetaMask'
          : 'Browser Wallet';
      },
    };
  });
}

function getConnectorWithId(
  connectors: readonly Connector[],
  id: ConnectorID,
  options?: {shouldThrow: true},
): Connector | undefined {
  const connector = connectors.find((c) => c.id === id);
  if (!connector && options?.shouldThrow) {
    throw new Error(`Expected connector ${id} missing from wagmi context.`);
  }
  return connector;
}

function getInjectedConnectors(connectors: readonly Connector[]) {
  let isCoinbaseWalletBrowser = false;
  const injectedConnectors = connectors.filter((c) => {
    // Special-case: Ignore coinbase eip6963-injected connector; coinbase connection is handled via the SDK connector.
    if (c.id === CONNECTION.COINBASE_RDNS) {
      if (Platform.OS === 'web') {
        isCoinbaseWalletBrowser = true;
      }
      return false;
    }

    return (
      c.type === CONNECTION.INJECTED_CONNECTOR_TYPE && c.id !== CONNECTION.INJECTED_CONNECTOR_ID
    );
  });

  // Special-case: Return deprecated window.ethereum connector when no eip6963 injectors are present.
  const fallbackInjector = getConnectorWithId(connectors, CONNECTION.INJECTED_CONNECTOR_ID, {
    shouldThrow: true,
  });
  if (!injectedConnectors.length && Boolean(window.ethereum)) {
    return {injectedConnectors: [fallbackInjector], isCoinbaseWalletBrowser};
  }

  return {injectedConnectors, isCoinbaseWalletBrowser};
}

type InjectableConnector = Connector & {isInjected?: boolean};
export function useOrderedConnections(): InjectableConnector[] {
  const {connectors} = useConnect();

  return useMemo(() => {
    const {injectedConnectors: injectedConnectorsBase, isCoinbaseWalletBrowser} =
      getInjectedConnectors(connectors);
    const injectedConnectors = injectedConnectorsBase.map((c) => ({...c, isInjected: true}));

    const coinbaseSdkConnector = getConnectorWithId(
      connectors,
      CONNECTION.COINBASE_SDK_CONNECTOR_ID,
      SHOULD_THROW,
    );
    const walletConnectConnector = getConnectorWithId(
      connectors,
      CONNECTION.WALLET_CONNECT_CONNECTOR_ID,
      SHOULD_THROW,
    );

    if (!coinbaseSdkConnector || !walletConnectConnector) {
      throw new Error('Expected connector(s) missing from wagmi context.');
    }

    // Special-case: Only display the injected connector for in-wallet browsers.
    if (Platform.OS === 'web' && injectedConnectors.length === 1) {
      return injectedConnectors;
    }

    // Special-case: Only display the Coinbase connector in the Coinbase Wallet.
    if (isCoinbaseWalletBrowser) {
      return [coinbaseSdkConnector];
    }

    const orderedConnectors: InjectableConnector[] = [];

    // Injected connectors should appear next in the list, as the user intentionally installed/uses them.
    orderedConnectors.push(...(injectedConnectors as any));

    // WalletConnect and Coinbase are added last in the list.
    orderedConnectors.push(walletConnectConnector);
    orderedConnectors.push(coinbaseSdkConnector);

    return orderedConnectors;
  }, [connectors]);
}
