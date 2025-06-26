import {useEffect, useState} from 'react';

import {LaunchDataMerged} from '../types/keys';
import {useGetDeployToken} from './api/indexer/useDeployToken';
import {useGetTokenLaunch} from './api/indexer/useLaunchTokens';

export const useCombinedTokenData = (token?: string, launch?: string) => {
  const {
    data: deployData,
    isLoading: isLoadingDeploy,
    isError: isErrorDeploy,
    isFetching: tokenIsFetching,
  } = useGetDeployToken(token);
  const {
    data: launchData,
    isLoading: isLoadingLaunch,
    isError: isErrorLaunch,
    isFetching: launchIsFetching,
  } = useGetTokenLaunch(launch);

  const [tokens, setTokens] = useState<LaunchDataMerged[]>([]);
  const [launches, setLaunches] = useState<LaunchDataMerged[]>([]);

  useEffect(() => {
    if (deployData) {
      setTokens(deployData.data || []);
    }

    if (deployData && launchData) {
      setLaunches(
        launchData.data.map((launchToken: any) => ({
          ...(deployData.data.find(
            (deployedToken: LaunchDataMerged) =>
              deployedToken.memecoin_address === launchToken.memecoin_address,
          ) || {}),
          ...launchToken,
        })),
      );
    }
  }, [deployData, launchData]);

  return {
    tokens,
    launches,
    isLoading: isLoadingDeploy || isLoadingLaunch,
    isError: isErrorDeploy || isErrorLaunch,
    isFetching: launchIsFetching || tokenIsFetching,
    setTokens,
    setLaunches,
  };
};
