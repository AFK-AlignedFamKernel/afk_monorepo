'use client';

import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { getToken } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { LaunchpadCard } from './LaunchpadCard';
import CryptoLoading from '../small/crypto-loading';
import { Icon } from '../small/icon-component';
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

interface LaunchpadWrapperCardProps {
  token_address: string;
}

export const LaunchpadWrapperCard: React.FC<LaunchpadWrapperCardProps> = ({ token_address }) => {


  const [token, setToken] = useState<any>(null);
  const [launch, setLaunch] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [firstFetch, setFirstFetch] = useState(true);
  const [isInitialFetch, setIsInitialFetch] = useState(false);

  const fetchToken = async () => {
    try {
      setIsFetching(true);
      console.log("fetchToken", token_address)
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/deploy/${token_address}`);
  
      const data = await res?.json();
      setToken(data?.data[0] ?? null);
      console.log("token", data)
      setIsFetching(false);
      setFirstFetch(false);
      setIsInitialFetch(true);
      setIsLoading(false);      
    } catch (error) {
      console.error("error", error)
      setIsFetching(false);
      setFirstFetch(false);
      setIsInitialFetch(true);
      setIsLoading(false);
    }

  };

  const fetchLaunch = async () => {
    try {
      console.log("fetchLaunch", token_address)
      setIsFetching(true);
      const launch = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/deploy-launch/${token_address}`);
      const data = await launch?.json();
      console.log("launch", data)
      setLaunch(data?.data[0] ?? null);
      setIsFetching(false);
      setFirstFetch(false);    
      setIsLoading(false);
    } catch (error) {
      console.error("error", error)
      setIsFetching(false);
      setFirstFetch(false);
      setIsLoading(false);
    }

  };
  useEffect(() => {

    if (!isInitialFetch) {
      fetchLaunch();
      fetchToken();

    }
  }, [token_address, isInitialFetch]);



  console.log("token", token)

  return (
    <div className="flex flex-col gap-4"  >

      <button onClick={() => {
        fetchToken();
        fetchLaunch();
      }}><Icon name="RefreshIcon" size={16} /></button>

      {isLoading && <div><CryptoLoading /></div>}

      {launch && !token && <LaunchpadCard token={{...launch, token_address: token_address}} type="LAUNCH" />}
      {token && !launch && <LaunchpadCard token={{...token, token_address: token_address}} type="TOKEN" />}
      {token && launch && <LaunchpadCard token={{...token, ...launch, token_address: token_address}} type="TOKEN" />}
    </div>
  );
}; 