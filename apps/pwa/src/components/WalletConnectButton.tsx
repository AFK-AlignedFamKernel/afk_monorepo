'use client';

import React from 'react';
import { useAccount, useConnect, useDisconnect, useInjectedConnectors, Connector } from '@starknet-react/core';
import { connect, getSelectedConnectorWallet, disconnect, Connector as StarknetkitConnector } from "starknetkit"
import { argent, braavos } from '@starknet-react/core';
import { ArgentMobileConnector } from "starknetkit/argentMobile"
import { InjectedConnector } from 'starknetkit/injected';
import { WebWalletConnector } from 'starknetkit/webwallet';

export const WalletConnectButton: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { disconnect: disconnectStarknet } = useDisconnect();
  const { connectors } = useInjectedConnectors({
    recommended: [argent(), braavos()],
    includeRecommended: 'onlyIfNoConnectors',
    order: 'random',
  });

  const { connect: connectStarknet } = useConnect();
  const handleConnect = async () => {
    try {
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

      await connectStarknet({ connector: connectors[0] });
      // Using starknetkit's connect function to show all available connectors
      const result = await connect({
        modalMode: "alwaysAsk",
        dappName: "AFK",
        modalTheme: "dark",
        connectors: connectors as Connector[]
      });

      if (result && result.wallet) {
        console.log("Connected to:", result.wallet.name);
      }
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  if (isConnected && address) {
    return (
      <>
        <button
          onClick={() => {
            disconnectStarknet();
            disconnect();
          }}
          className="wallet-button wallet-button--connected"
        >
          <span className="status-dot status-dot--connected"></span>
          {`${address.slice(0, 6)}...${address.slice(-4)}`}
        </button>
        <button
          onClick={() => {
            disconnectStarknet();
            disconnect();
          }}
          className="wallet-button wallet-button--connected"
        >
          <span className="status-dot status-dot--connected"></span>
          <span>Disconnect</span>
        </button>
      </>
    );
  }

  return (
    <button
      onClick={() => handleConnect()}
      className="wallet-button wallet-button--connect"
    >
      Connect Wallet
    </button>
  );
};