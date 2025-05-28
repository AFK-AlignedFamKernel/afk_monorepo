'use client';

import React from 'react';
import { useUIStore } from '@/store/uiStore';

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

  const { showModal } = useUIStore();


  const Filters = () => {
    return (
      <div className="absolute top-full left-0 mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 min-w-[200px]">
        <div className="flex flex-col gap-2">
          <button
            className={`sidebar-nav-item w-full text-left px-3 py-2 rounded-md ${sortBy === 'recent' ? 'active' : ''}`}
            onClick={() => setSortBy('recent')}
          >
            Most Recent
          </button>

          {isLaunchView && (
            <button
              className={`sidebar-nav-item w-full text-left px-3 py-2 rounded-md ${sortBy === 'liquidity' ? 'active' : ''}`}
              onClick={() => setSortBy('liquidity')}
            >
              Liquidity
            </button>
          )}

          <button
            className={`sidebar-nav-item w-full text-left px-3 py-2 rounded-md ${sortBy === 'oldest' ? 'active' : ''}`}
            onClick={() => setSortBy('oldest')}
          >
            Oldest First
          </button>

          {isLaunchView && (
            <button
              className={`sidebar-nav-item w-full text-left px-3 py-2 rounded-md ${sortBy === 'graduated' ? 'active' : ''}`}
              onClick={() => setSortBy('graduated')}
            >
              Graduated
            </button>
          )}
        </div>
      </div>
    )
  }
  return (
    <div >
      <button
        className={`sidebar-nav-item whitespace-nowrap flex items-center gap-2 ${showFilters ? 'active' : ''}`}
        onClick={() => {
          setShowFilters(!showFilters)
          // showModal(<Filters />)
        }}
      >
        <span>Filter & Sort</span>
        <span className="text-xs">{showFilters ? '▼' : '▶'}</span>
      </button>

      {showFilters && (
        <div className="mt-2 p-4  rounded-lg shadow-lg flex flex-row">
          <div className="flex flex-col gap-2">
            <button
              className={`sidebar-nav-item w-full text-left px-3 py-2 rounded-md ${sortBy === 'recent' ? 'active' : ''}`}
              onClick={() => {
                setSortBy('recent')
                setShowFilters(false)
              }}
            >
              Most Recent
            </button>

            {isLaunchView && (
              <button
                className={`sidebar-nav-item w-full text-left px-3 py-2 rounded-md ${sortBy === 'liquidity' ? 'active' : ''}`}
                onClick={() => {
                  setSortBy('liquidity')
                  setShowFilters(false)
                }}
              >
                Liquidity
              </button>
            )}

            <button
              className={`sidebar-nav-item w-full text-left px-3 py-2 rounded-md ${sortBy === 'oldest' ? 'active' : ''}`}
              onClick={() => {
                setSortBy('oldest')
                setShowFilters(false)
              }}
            >
              Oldest First
            </button>

            {isLaunchView && (
              <button
                className={`sidebar-nav-item w-full text-left px-3 py-2 rounded-md ${sortBy === 'graduated' ? 'active' : ''}`}
                onClick={() => {
                  setSortBy('graduated')
                  setShowFilters(false)
                }}
              >
                Graduated
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 