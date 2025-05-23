import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';
import { useCallback } from 'react';
import { Connector } from 'starknetkit';
import { InjectedConnector } from 'starknetkit/injected';
import { ArgentMobileConnector } from 'starknetkit/argentMobile';
import { WebWalletConnector } from 'starknetkit/webwallet';

export const useStarknet = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const availableConnectors = [
    new InjectedConnector({ options: { id: 'braavos' } }),
    new InjectedConnector({ options: { id: 'argentX' } }), 
    new WebWalletConnector({ url: 'https://web.argent.xyz' }),
    // new ArgentMobileConnector(),
  ];
  const { disconnect } = useDisconnect();

  const connectWallet = useCallback(async (connectorId: string) => {
    try {
      const connector = connectors.find((c) => c.id === connectorId);
      if (connector) {
        await connect({ connector });
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  }, [connect, connectors]);

  return {
    address,
    isConnected,
    connectWallet,
    disconnect,
    connectors,
  };
}; 