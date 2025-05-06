'use client';

import React from 'react';

interface LaunchpadCardProps {
  token: {
    token_address: string;
    name: string;
    symbol: string;
    description?: string;
    block_timestamp: string;
    liquidity_raised?: number;
    is_liquidity_added?: boolean;
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
      </div>

      {token.description && (
        <p className="text-sm text-shade-600 mb-4 line-clamp-2">{token.description}</p>
      )}

      <div className="flex justify-between items-center text-sm">
        <div className="text-shade-500">
          Created: {formatDate(token.block_timestamp)}
        </div>
        {type === 'LAUNCH' && token.liquidity_raised !== undefined && (
          <div className="text-shade-700">
            Liquidity: ${formatLiquidity(token.liquidity_raised)}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-shade-200">
        <button className="sidebar-nav-item w-full">
          View Details
        </button>
      </div>
    </div>
  );
}; 