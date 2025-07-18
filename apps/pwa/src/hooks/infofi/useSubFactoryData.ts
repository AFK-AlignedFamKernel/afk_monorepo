import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NostrProfileInfoFiInterface } from './useDataInfoMain';

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

// Hook to get all users from factory
export const useSubFactoryGetAllUsers = () => {
  return useQuery({
    queryKey: ['infofi', 'factory', 'all_users'],
    queryFn: async () => {
      return apiGet('/main-sub/all-users');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get all tip users from factory
export const useFactoryGetAllTipUser = () => {
  return useQuery({
    queryKey: ['infofi', 'factory', 'all_tip_user'],
    queryFn: async () => {
      return apiGet('/main-sub/all-tip-user/');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get tips by specific user from factory
export const useFactoryGetAllTipByUser = (nostr_address: string) => {
  return useQuery({
    queryKey: ['infofi', 'factory', 'all_tip_by_user', nostr_address],
    queryFn: async () => {
      return apiGet(`/main-sub/all-tip-user/${nostr_address}`);
    },
    enabled: !!nostr_address,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get overall state from factory
export const useFactoryOverallState = () => {
  return useQuery({
    queryKey: ['infofi', 'factory', 'overall_state'],
    queryFn: async () => {
      return apiGet('/main-sub/overall-state');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get all data from factory
export const useFactoryGetAllData = () => {
  return useQuery({
    queryKey: ['infofi', 'factory', 'all_data'],
    queryFn: async () => {
      return apiGet('/main-sub/all-data');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get all subs from score factory
export const useGetAllSubs = () => {
  return useQuery({
    queryKey: ['infofi', 'score_factory_subs'],
    queryFn: async () => {
      return apiGet('/score-factory/sub');
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get sub info by address
export const useGetSubInfo = (subAddress: string) => {
  return useQuery({
    queryKey: ['infofi', 'sub_info', subAddress],
    queryFn: async () => {
      return apiGet(`/score-factory/sub/${subAddress}`);
    },
    enabled: !!subAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get sub profiles by address
export const useGetSubProfiles = (subAddress: string) => {
  return useQuery({
    queryKey: ['infofi', 'sub_profiles', subAddress],
    queryFn: async () => {
      return apiGet(`/score-factory/sub/${subAddress}/profiles`);
    },
    enabled: !!subAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get sub profiles by epoch
export const useGetSubProfilesByEpoch = (subAddress: string, epochIndex: string) => {
  return useQuery({
    queryKey: ['infofi', 'sub_profiles_epoch', subAddress, epochIndex],
    queryFn: async () => {
      return apiGet(`/score-factory/sub/${subAddress}/epoch/${epochIndex}/profiles`);
    },
    enabled: !!subAddress && !!epochIndex,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get sub epochs
export const useGetSubEpochs = (subAddress: string) => {
  return useQuery({
    queryKey: ['infofi', 'sub_epochs', subAddress],
    queryFn: async () => {
      return apiGet(`/score-factory/sub/${subAddress}/epochs`);
    },
    enabled: !!subAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get sub aggregations
export const useGetSubAggregations = (subAddress: string) => {
  return useQuery({
    queryKey: ['infofi', 'sub_aggregations', subAddress],
    queryFn: async () => {
      return apiGet(`/score-factory/sub/${subAddress}/aggregations`);
    },
    enabled: !!subAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Combined hook for getting all score factory data
export const useScoreFactoryData = (subAddress?: string, epochIndex?: string) => {
  const {
    data: allSubs,
    isLoading: isLoadingSubs,
    isError: isErrorSubs,
    refetch: refetchSubs,
  } = useGetAllSubs();

  const {
    data: subDetails,
    isLoading: isLoadingDetails,
    isError: isErrorDetails,
    refetch: refetchDetails,
  } = useGetSubInfo(subAddress || '');

  const {
    data: subProfiles,
    isLoading: isLoadingProfiles,
    isError: isErrorProfiles,
    refetch: refetchProfiles,
  } = useGetSubProfiles(subAddress || '');

  const {
    data: epochProfiles,
    isLoading: isLoadingEpochProfiles,
    isError: isErrorEpochProfiles,
    refetch: refetchEpochProfiles,
  } = useGetSubProfilesByEpoch(subAddress || '', epochIndex || '');

  const {
    data: subEpochs,
    isLoading: isLoadingEpochs,
    isError: isErrorEpochs,
    refetch: refetchEpochs,
  } = useGetSubEpochs(subAddress || '');

  const {
    data: subAggregations,
    isLoading: isLoadingAggregations,
    isError: isErrorAggregations,
    refetch: refetchAggregations,
  } = useGetSubAggregations(subAddress || '');

  const refetch = async () => {
    await Promise.all([
      refetchSubs(),
      refetchDetails(),
      refetchProfiles(),
      refetchEpochProfiles(),
      refetchEpochs(),
      refetchAggregations(),
    ]);
  };

  return {
    // All subs data
    allSubs,
    isLoadingSubs,
    isErrorSubs,

    // Single sub details
    subDetailsData: subDetails,
    isLoadingDetails,
    isErrorDetails,

    // Sub profiles
    subProfiles,
    isLoadingProfiles,
    isErrorProfiles,

    // Epoch-specific profiles
    epochProfiles,
    isLoadingEpochProfiles,
    isErrorEpochProfiles,

    // Sub epochs
    subEpochs,
    isLoadingEpochs,
    isErrorEpochs,

    // Sub aggregations
    subAggregations,
    isLoadingAggregations,
    isErrorAggregations,

    // Combined loading and error states
    isLoading: isLoadingSubs || isLoadingDetails || isLoadingProfiles || 
               isLoadingEpochProfiles || isLoadingEpochs || isLoadingAggregations,
    isError: isErrorSubs || isErrorDetails || isErrorProfiles || 
             isErrorEpochProfiles || isErrorEpochs || isErrorAggregations,

    // Refetch functions
    refetch,
    refetchSubs,
    refetchDetails,
    refetchProfiles,
    refetchEpochProfiles,
    refetchEpochs,
    refetchAggregations,
  };
}; 