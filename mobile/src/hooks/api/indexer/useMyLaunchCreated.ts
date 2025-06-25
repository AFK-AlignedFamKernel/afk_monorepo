import {useQuery} from '@tanstack/react-query';

import {ApiIndexerInstance} from '../../../services/api';

export const useMyLaunchCreated = (userAddress?: string) => {
  return useQuery({
    queryKey: userAddress ? ['userAddress', userAddress] : ['deploy_token_by_user'],
    queryFn: async () => {
      const endpoint = `/deploy-launch/by/${userAddress}/`;
      const res = await ApiIndexerInstance.get(endpoint);
      if (res.status !== 200) {
        throw new Error('Failed to fetch my launch');
      }

      return res.data;
    },
    enabled: !!userAddress,
  });
};
