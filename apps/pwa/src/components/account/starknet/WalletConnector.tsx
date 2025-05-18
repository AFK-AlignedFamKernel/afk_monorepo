'use client';
 
import {
//   Connector,
  useAccount,
  useConnect,
  useDisconnect,
} from '@starknet-react/core';
import { StarknetkitConnector, Connector, useStarknetkitConnectModal } from 'starknetkit';
 
export function WalletConnector() {
  const { disconnect } = useDisconnect();
 
  const { connect, connectors } = useConnect();
 
  const { address } = useAccount();
 
  if (!address) {
    return (
      <button
        onClick={() => connect({
          connector : connectors[0] as Connector
        })}
        className=" text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors p-4"
      >
        Connect Wallet
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="p-2 bg-gray-100 rounded-lg ">
        Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
      </div>
      <button
        onClick={() => disconnect()}
        className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
}