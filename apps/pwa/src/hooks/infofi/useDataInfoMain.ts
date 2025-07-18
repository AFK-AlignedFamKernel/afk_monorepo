import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// Types
export interface NostrProfileInfoFiInterface {
  nostr_id: string;
  total_ai_score: string;
  total_vote_score: string;
  starknet_address?: string;
  is_add_by_admin?: boolean;
  epoch_states?: any[];
}

export interface AggregationsData {
  total_ai_score?: string;
  total_vote_score?: string;
  total_tips?: string;
  total_amount_deposit?: string;
  name?: string;
  main_tag?: string;
  contract_address?: string;
}

export interface ContractState {
  epochs: Array<{
    epoch_index: number;
    total_ai_score: string;
    total_vote_score: string;
    total_amount_deposit: string;
    total_tip: string;
  }>;
  user_profiles?: NostrProfileInfoFiInterface[];
}

export interface InfoFiData {
  aggregations: AggregationsData;
  contract_states: ContractState[];
}

// API base URL - replace with your actual backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_INDEXER_BACKEND_URL || 'http://localhost:3001';

// API helper function
const apiGet = async (endpoint: string) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${endpoint}`);
  }
  return response.json();
};

// Hook to get all users
export const useGetAllUsers = () => {
  return useQuery({
    queryKey: ['infofi', 'all_users'],
    queryFn: async () => {
      return apiGet('/main-sub/all-users');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get all tip users
export const useGetAllTipUser = () => {
  return useQuery({
    queryKey: ['infofi', 'all_tip_user'],
    queryFn: async () => {
      return apiGet('/main-sub/all-tip-user/');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get tips by specific user
export const useGetAllTipByUser = (nostr_address: string) => {
  return useQuery({
    queryKey: ['infofi', 'all_tip_by_user', nostr_address],
    queryFn: async () => {
      return apiGet(`/main-sub/all-tip-user/${nostr_address}`);
    },
    enabled: !!nostr_address,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get overall state
export const useOverallState = () => {
  return useQuery({
    queryKey: ['infofi', 'overall_state'],
    queryFn: async () => {
      return apiGet('/main-sub/overall-state');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get all data
export const useGetAllData = () => {
  return useQuery({
    queryKey: ['infofi', 'all_data'],
    queryFn: async () => {
      return apiGet('/main-sub/all-data');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Main hook that combines all data
export const useDataInfoMain = () => {
  const {
    data: allData,
    isLoading: isLoadingAll,
    isError: isErrorAll,
    isFetching: isFetchingAll,
    refetch: refetchAll,
  } = useGetAllData();

  const [tokens, setTokens] = useState<NostrProfileInfoFiInterface[]>([]);
  const [launches, setLaunches] = useState<NostrProfileInfoFiInterface[]>([]);

  useEffect(() => {
    if (allData?.data) {
      const userProfiles = allData.data.contract_states?.flatMap(
        (contract: ContractState) => contract.user_profiles || []
      ) || [];
      setTokens(userProfiles);
      setLaunches(userProfiles);
    }
  }, [allData]);

  return {
    tokens,
    launches,
    isLoading: isLoadingAll,
    isError: isErrorAll,
    isFetching: isFetchingAll,
    setTokens,
    setLaunches,
    allData: allData?.data,
    refetch: refetchAll,
  };
}; 