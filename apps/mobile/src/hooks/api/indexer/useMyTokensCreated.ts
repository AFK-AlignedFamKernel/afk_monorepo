import {useQuery} from '@tanstack/react-query';

import {ApiIndexerInstance} from '../../../services/api';

export const useMyTokensCreated = (userAddress?: string) => {
  return useQuery({
    queryKey: userAddress ? ['token', userAddress] : ['deploy_token_by_user'],
    queryFn: async () => {
      const endpoint = `/deploy/by/${userAddress}`;
      const res = await ApiIndexerInstance.get(endpoint);
      if (res.status !== 200) {
        throw new Error('Failed to fetch token launch');
      }

      return res.data;
    },
  });
};
