'use client';

import React from 'react';

export type SortOption = 'recent' | 'oldest' | 'liquidity' | 'graduated';

interface FilterProps {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  isLaunchView: boolean;
}

export const Filter: React.FC<FilterProps> = ({
  showFilters,
  setShowFilters,
  sortBy,
  setSortBy,
  isLaunchView,
}) => {
  return (
    <div className="w-full">
      <button
        className="w-full flex justify-between items-center"
        onClick={() => setShowFilters(!showFilters)}
      >
        <span>Filter & Sort</span>
        <span>{showFilters ? '▼' : '▶'}</span>
      </button>

      {showFilters && (
        <div className="mt-4 flex gap-2 horizontal-container">
          <button
            className={`sidebar-nav-item min-w-[120px] h-10 flex items-center justify-center ${sortBy === 'recent' ? 'active' : ''}`}
            onClick={() => setSortBy('recent')}
          >
            Most Recent
          </button>

          {isLaunchView && (
            <button
              className={`sidebar-nav-item min-w-[120px] h-10 flex items-center justify-center ${sortBy === 'liquidity' ? 'active' : ''}`}
              onClick={() => setSortBy('liquidity')}
            >
              Liquidity
            </button>
          )}

          <button
            className={`sidebar-nav-item min-w-[120px] h-10 flex items-center justify-center ${sortBy === 'oldest' ? 'active' : ''}`}
            onClick={() => setSortBy('oldest')}
          >
            Oldest First
          </button>

          {isLaunchView && (
            <button
              className={`sidebar-nav-item min-w-[120px] h-10 flex items-center justify-center ${sortBy === 'graduated' ? 'active' : ''}`}
              onClick={() => setSortBy('graduated')}
            >
              Graduated
            </button>
          )}
        </div>
      )}
    </div>
  );
}; 