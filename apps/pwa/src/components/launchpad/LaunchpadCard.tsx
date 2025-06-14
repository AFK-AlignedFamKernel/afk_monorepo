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
    total_token_holded?: string;
    price?: string;
    total_supply?: string;
    network?: string;
    created_at?: string;
    market_cap?: string;
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
      minimumFractionDigits: 5,
      maximumFractionDigits: 5,
    });
  };

  // console.log("token", token)
  // console.log("type", type)

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start gap-2">
        <div className="flex justify-between items-center text-sm">

          {token?.url && (token?.url !== "" && token?.url !== null && token?.url !== undefined) && (
            <Image src={token?.url} alt={token.name} width={50} height={50}
              className="rounded-lg"
            />
          )}
        </div>
        <div>
          <h3 className="text-lg font-semibold">{token.name}</h3>
          <p className="text-sm text-shade-500">{token.symbol}</p>
        </div>
        {type === 'LAUNCH' && token.is_liquidity_added && (
          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
            Graduated
          </span>
        )}
        <div className="text-shade-500 text-xs">
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
              Raised: {token.liquidity_raised?.toFixed(5)}
            </div>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div className="text-xs font-semibold text-shade-600">
                  Progress: {((Number(token.liquidity_raised ?? 0) / Number(token.threshold_liquidity)) * 100).toFixed(1)}%
                </div>
              </div>
              <div className="relative w-full h-3 bg-shade-100 rounded-full overflow-hidden border border-shade-200 shadow-sm">
                <div
                  className={`absolute h-full transition-all duration-300 ease-in-out ${
                    Number(token.liquidity_raised) <= Number(token.threshold_liquidity) - Number(token.threshold_liquidity) * 0.02
                      ? 'bg-yellow-500'
                      : 'bg-primary-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (Number(token.liquidity_raised ?? 0) / Number(token.threshold_liquidity)) * 100)}%`,
                    animation: 'slideProgress 1s ease-in-out'
                  }}
                />
              </div>
              <style jsx>{`
                @keyframes slideProgress {
                  from {
                    width: 0%;
                  }
                  to {
                    width: ${Math.min(100, (Number(token.liquidity_raised ?? 0) / Number(token.threshold_liquidity)) * 100)}%;
                  }
                }
              `}</style>

              <div className="text-xs text-shade-500 mt-1">
                {formatLiquidity(Number(token.liquidity_raised))} / {formatLiquidity(Number(token.threshold_liquidity))}
              </div>
            </div>
            {token?.bonding_type && (
              <div className="text-xs text-shade-500 mt-1">
                {token?.bonding_type}
              </div>
            )}
          </div>
        )}
      </div>
      {/* <div className="flex justify-between items-center text-sm">
        {token?.url && (token?.url !== "" && token?.url !== null && token?.url !== undefined) && (
          <Image src={token?.url} alt={token.name} width={100} height={100} />
        )}
      </div> */}

      <div className="mt-4 pt-4 flex">


        <Link href={`/launchpad/${token.token_address}`} className="sidebar-nav-item w-full">
          View Details
        </Link>

        {/* <button></button> */}
      </div>
    </div>
  );
}; 