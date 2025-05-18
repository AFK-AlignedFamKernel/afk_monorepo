'use client';

import React from 'react';
import { useAccount, useConnect, useDisconnect, useInjectedConnectors, Connector, argent, braavos, cartridgeProvider, } from '@starknet-react/core';
import { connect, getSelectedConnectorWallet, disconnect, Connector as StarknetkitConnector } from "starknetkit"
import { ArgentMobileConnector } from "starknetkit/argentMobile"
import { InjectedConnector } from 'starknetkit/injected';
import { WebWalletConnector } from 'starknetkit/webwallet';
// import { ControllerConnector } from '@cartridge/connector';
import ControllerConnector from "@cartridge/connector/controller";
import { constants } from 'starknet';
import { connectors } from './connectors';
import { useUIStore } from '@/store/uiStore';

export const WalletConnectButtonController: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { disconnect: disconnectStarknet } = useDisconnect();

  const { showToast } = useUIStore();
  // const cartridgeConnector = new ControllerConnector({
  //   rpc: cartridgeProvider().nodeUrl,
  // });

  // Initialize the connector
  // const cartridgeConnector = new ControllerConnector({
  //   url: 'https://api.cartridge.gg/x/starknet/sepolia',
  //   defaultChainId: constants.StarknetChainId.SN_SEPOLIA,
  //   chains: [
  //     {
  //       rpcUrl: 'https://api.cartridge.gg/x/starknet/sepolia',
  //     },
  //   ],
  // })
  const cartridgeConnector = new ControllerConnector({
    // url: cartridgeProvider()?.nodeUrl ?? 'https://api.cartridge.gg/x/starknet/sepolia',
    url: 'https://api.cartridge.gg/x/starknet/sepolia',
    defaultChainId: constants.StarknetChainId.SN_SEPOLIA,
    chains: [
      {
        rpcUrl: 'https://api.cartridge.gg/x/starknet/sepolia',
      },
    ],
  });

  // const { connectors } = useInjectedConnectors({
  //   recommended: [argent(), braavos()],
  //   includeRecommended: 'onlyIfNoConnectors',
  //   order: 'random',
  // });
  // const connectors = [
  //   cartridgeConnector,
  //   new InjectedConnector({
  //     options: { id: "argentX", name: "Argent X" },
  //   }),
  //   new InjectedConnector({
  //     options: { id: "braavos", name: "Braavos" },
  //   }),
  //   new WebWalletConnector({ url: "https://web.argent.xyz" }),
  //   new ArgentMobileConnector(),
  // ]

  const { connect: connectStarknet } = useConnect();
  const handleConnect = async () => {
    try {


      // await connectStarknet({ connector: connectors[0] });
      // Using starknetkit's connect function to show all available connectors
      const result = await connect({
        modalMode: "alwaysAsk",
        dappName: "AFK",
        modalTheme: "dark",
        connectors: connectors as any[]
        // connectors: connectors as Connector[]
      });


      if (result && result.wallet) {
        console.log(result);
        console.log("Connected to:", result.wallet.name);
        connectStarknet({ connector: result?.connector as Connector });

        showToast({
          message: "Connected to:",
          type: "success",
          duration: 3000,
        });
      } else {
        showToast({
          message: "Failed to connect",
          type: "error",
          duration: 3000,
        });
      }

    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  if (isConnected && address) {
    return (
      <div className="flex flex-col gap-2">
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
          className="border border-solid border-raisin-black rounded-lg p-2"
        >
          <span className="status-dot status-dot--connected"></span>
          <span>Disconnect</span>
        </button>
      </div>
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