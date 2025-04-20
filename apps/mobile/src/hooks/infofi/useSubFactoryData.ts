import {useEffect, useState} from 'react';

import {NostrProfileInfoFiInterface} from '../../types/infofi';
import {useGetTokenLaunch} from '../api/indexer/useLaunchTokens';

import {useQuery} from '@tanstack/react-query';

import {ApiIndexerInstance} from '../../services/api';

export const useGetAllUsers = () => {
  return useQuery({
    queryKey: ['all_users'],
    queryFn: async () => {
      const endpoint = '/main-sub/all-users';
      const res = await ApiIndexerInstance.get(endpoint);
      if (res.status !== 200) {
        throw new Error('Failed to fetch all users');
      }

      return res.data;
    },
  });
};


export const useGetEpochState = () => {
  return useQuery({
    queryKey: ['epoch_state'],
    queryFn: async () => {
      const endpoint = '/main-sub/epoch-state';
      const res = await ApiIndexerInstance.get(endpoint);
      if (res.status !== 200) {
        throw new Error('Failed to fetch epoch state');
      }

      return res.data;
    },
  });
};

export const useGetAllTipUser = () => {
  return useQuery({
    queryKey: ['all_tip_user'],
    queryFn: async () => {
      const endpoint = '/main-sub/all-tip-user/';
      const res = await ApiIndexerInstance.get(endpoint);
      if (res.status !== 200) {
        throw new Error('Failed to fetch epoch state');
      }

      return res.data;
    },
  });
};

export const useGetAllTipByUser = (nostr_address: string) => {
  return useQuery({
    queryKey: ['all_tip_by_user'],
    queryFn: async () => {
      const endpoint = `/main-sub/all-tip-user/${nostr_address}`;
      const res = await ApiIndexerInstance.get(endpoint);
      if (res.status !== 200) {
        throw new Error('Failed to fetch epoch state');
      }

      return res.data;
    },
  });
}

export const useOverallState = () => {
  return useQuery({
    queryKey: ['overall_state'],
    queryFn: async () => {
      const endpoint = `/main-sub/overall-state`;
      const res = await ApiIndexerInstance.get(endpoint);
      if (res.status !== 200) {
        throw new Error('Failed to fetch epoch state');
      }

      return res.data;
    },
  });
}

export const useGetAllData = () => {
  return useQuery({
    queryKey: ['all_data'],
    queryFn: async () => {
      const endpoint = '/main-sub/all-data';
      const res = await ApiIndexerInstance.get(endpoint);
      if (res.status !== 200) {
        throw new Error('Failed to fetch all data');
      }
      return res.data;
    },
  });
};

export const useDataInfoMain = () => {
  const {
    data: allData,
    isLoading: isLoadingAll,
    isError: isErrorAll,
    isFetching: isFetchingAll,
  } = useGetAllData();

  const [tokens, setTokens] = useState<NostrProfileInfoFiInterface[]>([]);
  const [launches, setLaunches] = useState<NostrProfileInfoFiInterface[]>([]);

  useEffect(() => {
    if (allData) {
      const userProfiles = allData.data.contract_states.flatMap(
        (contract: any) => contract.user_profiles
      );
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
  };
};


// export const useDataInfoMain = (token?: string, launch?: string) => {
//   const {
//     data: deployData,
//     isLoading: isLoadingDeploy,
//     isError: isErrorDeploy,
//     isFetching: tokenIsFetching,
//   } = useGetAllUsers();
//   const {
//     data: launchData,
//     isLoading: isLoadingLaunch,
//     isError: isErrorLaunch,
//     isFetching: launchIsFetching,
//   } = useGetTokenLaunch(launch);

//   const [tokens, setTokens] = useState<LaunchDataMerged[]>([]);
//   const [launches, setLaunches] = useState<LaunchDataMerged[]>([]);

//   useEffect(() => {
//     if (deployData) {
//       setTokens(deployData.data || []);
//     }

//     if (deployData && launchData) {
//       setLaunches(
//         launchData.data.map((launchToken: any) => ({
//           ...(deployData.data.find(
//             (deployedToken: LaunchDataMerged) =>
//               deployedToken.memecoin_address === launchToken.memecoin_address,
//           ) || {}),
//           ...launchToken,
//         })),
//       );
//     }
//   }, [deployData, launchData]);

//   return {
//     tokens,
//     launches,
//     isLoading: isLoadingDeploy || isLoadingLaunch,
//     isError: isErrorDeploy || isErrorLaunch,
//     isFetching: launchIsFetching || tokenIsFetching,
//     setTokens,
//     setLaunches,
//   };
// };

// Get all subs from score factory
export const useGetAllSubs = () => {
  return useQuery({
    queryKey: ['score_factory_subs'],
    queryFn: async () => {
      const endpoint = '/score-factory/sub';
      const res = await ApiIndexerInstance.get(endpoint);
      if (res.status !== 200) {
        throw new Error('Failed to fetch score factory subs');
      }
      return res.data;
    },
  });
};

// Get specific sub details
export const useGetSubDetails = (subAddress: string) => {
  return useQuery({
    queryKey: ['score_factory_sub', subAddress],
    queryFn: async () => {
      const endpoint = `/score-factory/sub/${subAddress}`;
      const res = await ApiIndexerInstance.get(endpoint);
      if (res.status !== 200) {
        throw new Error('Failed to fetch sub details');
      }
      return res.data;
    },
    enabled: !!subAddress, // Only run query if subAddress is provided
  });
};

// Get all profiles for a specific sub
export const useGetSubProfiles = (subAddress: string) => {
  return useQuery({
    queryKey: ['score_factory_profiles', subAddress],
    queryFn: async () => {
      const endpoint = `/score-factory/sub/${subAddress}/profile`;
      const res = await ApiIndexerInstance.get(endpoint);
      if (res.status !== 200) {
        throw new Error('Failed to fetch sub profiles');
      }
      return res.data;
    },
    enabled: !!subAddress,
  });
};

// Get profiles for a specific sub and epoch
export const useGetSubProfilesByEpoch = (subAddress: string, epochIndex: string) => {
  return useQuery({
    queryKey: ['score_factory_profiles_epoch', subAddress, epochIndex],
    queryFn: async () => {
      const endpoint = `/score-factory/sub/${subAddress}/${epochIndex}`;
      const res = await ApiIndexerInstance.get(endpoint);
      if (res.status !== 200) {
        throw new Error('Failed to fetch sub profiles for epoch');
      }
      return res.data;
    },
    enabled: !!subAddress && !!epochIndex,
  });
};

// Combined hook for getting all score factory data
export const useScoreFactoryData = (subAddress?: string, epochIndex?: string) => {
  const {
    data: allSubs,
    isLoading: isLoadingSubs,
    isError: isErrorSubs,
  } = useGetAllSubs();

  const {
    data: subDetails,
    isLoading: isLoadingDetails,
    isError: isErrorDetails,
  } = useGetSubDetails(subAddress || '');

  const {
    data: subProfiles,
    isLoading: isLoadingProfiles,
    isError: isErrorProfiles,
  } = useGetSubProfiles(subAddress || '');

  const {
    data: epochProfiles,
    isLoading: isLoadingEpochProfiles,
    isError: isErrorEpochProfiles,
  } = useGetSubProfilesByEpoch(subAddress || '', epochIndex || '');

  return {
    // All subs data
    allSubs,
    isLoadingSubs,
    isErrorSubs,

    // Single sub details
    subDetails,
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

    // Combined loading and error states
    isLoading: isLoadingSubs || isLoadingDetails || isLoadingProfiles || isLoadingEpochProfiles,
    isError: isErrorSubs || isErrorDetails || isErrorProfiles || isErrorEpochProfiles,
  };
};

// Types for the data
export interface SubState {
  contract_address: string;
  current_epoch_index?: string;
  total_ai_score?: string;
  total_vote_score?: string;
  total_tips?: string;
  total_amount_deposit?: string;
  total_to_claimed?: string;
  name?: string;
  about?: string;
  main_tag?: string;
  keyword?: string;
  keywords?: string[];
}

export interface UserEpochState {
  nostr_id: string;
  epoch_index: string;
  contract_address: string;
  total_tip?: string;
  total_ai_score?: string;
  total_vote_score?: string;
  amount_claimed?: string;
}

// Example usage in a component:
/*
const MyComponent = () => {
  const { 
    allSubs, 
    subDetails, 
    subProfiles, 
    epochProfiles,
    isLoading,
    isError 
  } = useScoreFactoryData('0x123...', '1');

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorMessage />;

  return (
    <div>
      {allSubs?.map(sub => (
        <SubCard key={sub.contract_address} sub={sub} />
      ))}
    </div>
  );
};
*/
