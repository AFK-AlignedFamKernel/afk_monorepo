'use client';

import React from 'react';
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core';

export const WalletConnectButton: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = async () => {
    try {
      await connect({ connector: connectors[0] });
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="wallet-button wallet-button--connected"
      >
        <span className="status-dot status-dot--connected"></span>
        {`${address.slice(0, 6)}...${address.slice(-4)}`}
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="wallet-button wallet-button--connect"
    >
      Connect Wallet
    </button>
  );
};