'use client';

import Link from 'next/link';
import React from 'react';
import Image from 'next/image';
interface LaunchpadCardProps {
  token: {
    token_address: string;
    name: string;
    symbol: string;
    description?: string;
    block_timestamp: string;
    liquidity_raised?: number;
    is_liquidity_added?: boolean;
    url?: string | null;
    threshold_liquidity?: number;
    bonding_type?: string;
  };
  type: 'TOKEN' | 'LAUNCH';
}

export const LaunchpadCard: React.FC<LaunchpadCardProps> = ({ token, type }) => {
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatLiquidity = (amount?: number) => {
    if (!amount) return '0';
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };


  console.log("token", token)
  console.log("type", type)

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">{token.name}</h3>
          <p className="text-sm text-shade-500">{token.symbol}</p>
        </div>
        {type === 'LAUNCH' && token.is_liquidity_added && (
          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
            Graduated
          </span>
        )}
        <div className="text-shade-500">
          Created: {formatDate(token.block_timestamp)}
        </div>

      </div>

      {token.description && (
        <p className="text-sm text-shade-600 mb-4 line-clamp-2">{token.description}</p>
      )}

      <div className="flex justify-between items-center text-sm">
        {/* <div className="text-shade-500">
          Created: {formatDate(token.block_timestamp)}
        </div> */}

        {type === 'LAUNCH' && token.threshold_liquidity && (
          <div className="mt-2 w-full">
            <div className="text-shade-700">
              Raised: {token.liquidity_raised?.toFixed(2)}
              {/* Liquidity: ${formatLiquidity(token.liquidity_raised)} */}
            </div>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div className="text-xs font-semibold text-shade-600">
                  Progress: {((Number(token.liquidity_raised ?? 0) / Number(token.threshold_liquidity)) * 100).toFixed(0)}%
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-shade-200">
                <div
                  style={{ width: `${Math.min(100, (Number(token.liquidity_raised ?? 0) / Number(token.threshold_liquidity)) * 100)}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500"
                ></div>
              </div>
              <div className="text-xs text-shade-500">
                {formatLiquidity(Number(token.liquidity_raised))} / {formatLiquidity(Number(token.threshold_liquidity))}
              </div>
            </div>
            {token?.bonding_type && (
              <div className="text-xs text-shade-500">
                {token?.bonding_type}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex justify-between items-center text-sm">

        {token?.url && (token?.url !== ""  && token?.url !== null  && token?.url !== undefined) && (
          <Image src={token?.url} alt={token.name} width={100} height={100} />
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-shade-200">
        <Link href={`/launchpad/${token.token_address}`} className="sidebar-nav-item w-full">
          View Details
        </Link>
      </div>
    </div>
  );
}; 