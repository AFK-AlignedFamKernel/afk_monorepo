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
