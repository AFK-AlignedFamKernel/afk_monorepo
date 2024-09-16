import {useQuery} from '@tanstack/react-query';

import {ApiIndexerInstance} from '../../../services/api';

export const useGetTokenStats = (tokenAddress: string) => {
  return useQuery({
    queryKey: ['stats', tokenAddress],
    queryFn: async () => {
      const endpoint = `/stats/${tokenAddress}`;
      const res = await ApiIndexerInstance.get(endpoint);

      if (res.status !== 200) {
        throw new Error('Failed to fetch token stats');
      }

      return res.data;
    },
  });
};
