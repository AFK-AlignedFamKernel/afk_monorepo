'use client';

import React, { useState, useMemo } from 'react';
import { Search } from '@/components/launchpad/Search';
import { Filter, SortOption } from '@/components/launchpad/Filter';
import { LaunchpadCard } from '@/components/launchpad/LaunchpadCard';
import { useTokens } from '@/hooks/api/indexer/useTokens';
import { useLaunches } from '@/hooks/api/indexer/useLaunches';
import Link from 'next/link';

export default function LaunchpadPage() {
  const [showFilters, setShowFilters] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [tokenOrLaunch, setTokenOrLaunch] = useState<'TOKEN' | 'LAUNCH' | 'MY_DASHBOARD' | 'MY_LAUNCH_TOKEN'>('LAUNCH');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: tokens, isLoading: isLoadingTokens, error: tokensError } = useTokens();
  const { data: launches, isLoading: isLoadingLaunches, error: launchesError } = useLaunches();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const isLaunchView = tokenOrLaunch === 'LAUNCH' || tokenOrLaunch === 'MY_LAUNCH_TOKEN';

  const filteredData = useMemo(() => {
    const data = isLaunchView ? launches : tokens;
    if (!data) return [];

    let filtered = [...data];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.name.toLowerCase().includes(query) ||
          item.symbol.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.block_timestamp).getTime() - new Date(a.block_timestamp).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.block_timestamp).getTime() - new Date(b.block_timestamp).getTime());
        break;
      case 'liquidity':
        filtered.sort((a, b) => (b.liquidity_raised || 0) - (a.liquidity_raised || 0));
        break;
      case 'graduated':
        filtered.sort((a, b) => (b.is_liquidity_added ? 1 : 0) - (a.is_liquidity_added ? 1 : 0));
        break;
    }

    return filtered;
  }, [isLaunchView, launches, tokens, searchQuery, sortBy]);

  const isLoading = isLoadingTokens || isLoadingLaunches;
  const error = tokensError || launchesError;

  if (error) {
    return (
      <div className="content">
        <div className="card">
          <div className="text-red-500">Error loading data: {error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="content">
      <Link href="/launchpad/create">Create Token</Link>  
      <div className="card">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <Search onSearch={handleSearch} placeholder="Search tokens or launches..." />

          {/* Action Toggle */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              className={`sidebar-nav-item ${tokenOrLaunch === 'LAUNCH' ? 'active' : ''}`}
              onClick={() => setTokenOrLaunch('LAUNCH')}
            >
              Launches
            </button>
            <button
              className={`sidebar-nav-item ${tokenOrLaunch === 'TOKEN' ? 'active' : ''}`}
              onClick={() => {
                setTokenOrLaunch('TOKEN');
                if (sortBy === 'liquidity' || sortBy === 'graduated') {
                  setSortBy('recent');
                }
              }}
            >
              Tokens
            </button>
            <button
              className={`sidebar-nav-item ${tokenOrLaunch === 'MY_DASHBOARD' ? 'active' : ''}`}
              onClick={() => {
                setTokenOrLaunch('MY_DASHBOARD');
                if (sortBy === 'liquidity' || sortBy === 'graduated') {
                  setSortBy('recent');
                }
              }}
            >
              My Tokens
            </button>
            <button
              className={`sidebar-nav-item ${tokenOrLaunch === 'MY_LAUNCH_TOKEN' ? 'active' : ''}`}
              onClick={() => setTokenOrLaunch('MY_LAUNCH_TOKEN')}
            >
              My Launched Tokens
            </button>
          </div>

          {/* Filter Section */}
          <Filter
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            sortBy={sortBy}
            setSortBy={setSortBy}
            isLaunchView={isLaunchView}
          />

          {/* Content Grid */}
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-shade-500">
              No {isLaunchView ? 'launches' : 'tokens'} found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredData.map((item) => (
                <LaunchpadCard
                  key={item.token_address}
                  token={item}
                  type={isLaunchView ? 'LAUNCH' : 'TOKEN'}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 