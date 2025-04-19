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

export const useDataInfoMain = () => {
  const {
    data: userData,
    isLoading: isLoadingDeploy,
    isError: isErrorDeploy,
    isFetching: tokenIsFetching,
  } = useGetAllUsers();

  console.log("users data", userData);
  // const {
  //   data: launchData,
  //   isLoading: isLoadingLaunch,
  //   isError: isErrorLaunch,
  //   isFetching: launchIsFetching,
  // } = useGetTokenLaunch(launch);

  const [tokens, setTokens] = useState<NostrProfileInfoFiInterface[]>([]);
  const [launches, setLaunches] = useState<NostrProfileInfoFiInterface[]>([]);

  useEffect(() => {
    if (userData) {
      setTokens(userData.data || []);
      setLaunches(userData.data || []);
    }

    // if (deployData && launchData) {
    //   setLaunches(
    //     launchData.data.map((launchToken: any) => ({
    //       ...(deployData.data.find(
    //         (deployedToken: LaunchDataMerged) =>
    //           deployedToken.memecoin_address === launchToken.memecoin_address,
    //       ) || {}),
    //       ...launchToken,
    //     })),
    //   );
    // }
  }, [userData]);

  return {
    tokens,
    launches,
    isLoading: isLoadingDeploy,
    isError: isErrorDeploy,
    isFetching: tokenIsFetching,
    setTokens,
    setLaunches,
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
