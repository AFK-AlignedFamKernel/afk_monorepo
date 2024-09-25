import {useQuery} from '@tanstack/react-query';

import {ApiIndexerInstance} from '../../../services/api';

export const useGetTransactions = (tokenAddress: string, userId: string) => {
  return useQuery({
    queryKey: ['transactions', tokenAddress, userId],
    queryFn: async () => {
      const endpoint = `/my-share/${tokenAddress}/${userId}`;
      const res = await ApiIndexerInstance.get(endpoint);

      if (res.status !== 200) {
        throw new Error('Failed to fetch token transactions');
      }

      return res.data;
    },
  });
};
