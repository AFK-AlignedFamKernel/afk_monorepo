'use client';

import React, { useState, useMemo } from 'react';
import { Search } from '@/components/launchpad/Search';
import { Filter, SortOption } from '@/components/launchpad/Filter';
import { LaunchpadCard } from '@/components/launchpad/LaunchpadCard';
import { useTokens } from '@/hooks/api/indexer/useTokens';
import { useLaunches } from '@/hooks/api/indexer/useLaunches';
import { TokenCreateForm } from './TokenCreateForm';
import { useUIStore } from '@/store/uiStore';
import Image from 'next/image';
import Link from "next/link"
import { Icon } from '../small/icon-component';

interface TokenDeployInterface {
  token_address: string;
  memecoin_address?: string;
  name?: string;
  symbol?: string;
  description?: string;
  block_timestamp: string;
  liquidity_raised?: string | number;
  is_liquidity_added?: boolean;
  quote_token?: string;
  price?: string;
  total_supply?: string;
  network?: string;
  created_at?: string;
  threshold_liquidity?: string;
  bonding_type?: string;
  total_token_holded?: string | null;
  url?: string;
  market_cap?: string;
  twitter?: string;
  website?: string;
  telegram?: string;
  discord?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
}

export default function PumpComponent() {

  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [tokenOrLaunch, setTokenOrLaunch] = useState<'TOKEN' | 'LAUNCH' | 'MY_DASHBOARD' | 'MY_LAUNCH_TOKEN'>('LAUNCH');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: tokens, isLoading: isLoadingTokens, error: tokensError } = useTokens();
  const { data: launches, isLoading: isLoadingLaunches, error: launchesError } = useLaunches();

  const { showModal } = useUIStore();
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
          item.name?.toLowerCase().includes(query) ||
          item.symbol?.toLowerCase().includes(query) ||
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
        filtered.sort((a, b) => (Number(b.liquidity_raised) || 0) - (Number(a.liquidity_raised) || 0));
        break;
      case 'graduated':
        filtered.sort((a, b) => (b.is_liquidity_added ? 1 : 0) - (a.is_liquidity_added ? 1 : 0));
        filtered = filtered.filter(item => item.is_liquidity_added);
        break;
    }

    return filtered;
  }, [isLaunchView, launches, tokens, searchQuery, sortBy]);

  const isLoading = isLoadingTokens || isLoadingLaunches;
  const error = tokensError || launchesError;

  // if (error) {
  //   return (
  //     <div className="content">
  //       <div className="card">
  //         <div className="text-red-500">Error loading data: {error.message}</div>
  //       </div>
  //     </div>
  //   );
  // }

  // console.log("filteredData", filteredData)

  return (
    <div className="content">
      <div className="flex justify-between items-center mb-6">
        {/* <h1 className="text-2xl font-bold">Launchpad</h1> */}

        <button
          className="px-4 py-2 btn btn-primary rounded-lg hover:bg-primary-700 transition-colors"
          onClick={() => {
            // setTokenOrLaunch('LAUNCH');
            showModal(<TokenCreateForm />);
          }}
        >
          Create Token
          {/* <a
            href="/launchpad/create"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Create Token
          </a> */}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Search */}



        {/* Action Toggle */}
        <div className="flex items-baseline gap-3 overflow-x-auto pb-2">
          <div className="flex justify-between items-center mb-6"
          >
            {/* <Search onSearch={handleSearch} placeholder="Search tokens or launches..." /> */}
            <Filter
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              sortBy={sortBy}
              setSortBy={setSortBy}
              isLaunchView={isLaunchView}
            />
          </div>
          <button
            className={`sidebar-nav-item whitespace-nowrap ${tokenOrLaunch === 'LAUNCH' ? 'active' : ''}`}
            onClick={() => setTokenOrLaunch('LAUNCH')}
          >
            Launches
          </button>
          <button
            className={`sidebar-nav-item whitespace-nowrap ${tokenOrLaunch === 'TOKEN' ? 'active' : ''}`}
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
            className={`sidebar-nav-item whitespace-nowrap ${tokenOrLaunch === 'MY_DASHBOARD' ? 'active' : ''}`}
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
            className={`sidebar-nav-item whitespace-nowrap ${tokenOrLaunch === 'MY_LAUNCH_TOKEN' ? 'active' : ''}`}
            onClick={() => setTokenOrLaunch('MY_LAUNCH_TOKEN')}
          >
            My Launches
          </button>
        </div>

        {/* Filter Section */}
        {/* <Filter
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            sortBy={sortBy}
            setSortBy={setSortBy}
            isLaunchView={isLaunchView}
          /> */}

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
          <div className="gap-1 overflow-y-auto scrollbar-hide scrollbar-width-none">
            {/* <table className="min-w-full text-sm overflow-x-auto overflow-y-auto max-h-[350px] scrollbar-hide scrollbar-width-none">
                  <thead>
                    <tr className="bg-muted gap-2">
                      <th className="px-4 py-2 text-left font-semibold">Project</th>
                      <th className="px-4 py-2 text-left font-semibold">Actions</th>
                      <th className="px-4 py-2 text-left font-semibold">Info</th>
                      <th className="px-4 py-2 text-left font-semibold">Socials</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item: TokenDeployInterface) => (
                      <tr className="border-b border-gray-200"
                        onClick={() => {
                        }}
                      >
                        <td className="px-2 py-3 flex flex-row items-left gap-1 baseline">
                          {item?.url && (
                            <Image src={item?.url}
                              alt={item?.name || item?.symbol || "Token"}
                              width={50}
                              height={50}
                              className='rounded-full'
                            />
                          )}

                          <div>
                            <p className="text-sm font-semibold">{item?.name}</p>
                            <p className="text-xs">{item?.symbol}</p>
                          </div>
                        </td>
                        <td>
                          <Link href={`/launchpad/${item?.memecoin_address || item?.token_address}`}>
                            View
                          </Link>
                        </td>
                        <td className="text-xs">
                          {item?.liquidity_raised && Number(item?.liquidity_raised) > 0 && (
                            <div className="flex flex-row gap-2">
                              <p className="text-xs">
                                Price: {Number(item?.price).toFixed(2) || "N/A"}
                              </p>

                            </div>
                          )}
                          <p className="text-xs">Liquidity:{Number(item?.liquidity_raised).toFixed(2) || "N/A"}</p>
                          <p className="text-xs">MC:{Number(item?.market_cap).toFixed(2) || "N/A"}</p>
                        </td>
                        <td className='flex flex-row gap-2'>
                          {item?.twitter && (
                            <Link href={item?.twitter}>
                              <Image src="assets/icons/twitter.svg" width={20} height={20} alt="Twitter"></Image>
                            </Link>
                          )}

                          {item?.website && (
                            <Link href={item?.website}>
                            </Link>
                          )}

                          {item?.telegram && (
                            <Link href={item?.telegram}>
                            </Link>
                          )}

                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table> */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredData.map((item: TokenDeployInterface) => (
                <LaunchpadCard
                  key={item.memecoin_address || item.token_address}
                  token={{
                    token_address: item.memecoin_address || item.token_address,
                    name: item.name || 'Unnamed Token',
                    symbol: item.symbol || '???',
                    description: item.description,
                    block_timestamp: item.block_timestamp,
                    liquidity_raised: Number(item.liquidity_raised) || 0,
                    is_liquidity_added: item.is_liquidity_added,
                    threshold_liquidity: Number(item.threshold_liquidity) || 0,
                    url: item.url,
                    price: item.price,
                    total_supply: item.total_supply,
                    network: item.network,
                    created_at: item.created_at,
                    bonding_type: item.bonding_type,
                    total_token_holded: item.total_token_holded || '0',

                  }}
                  type={isLaunchView ? 'LAUNCH' : 'TOKEN'}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 