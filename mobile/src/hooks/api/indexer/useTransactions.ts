import {useQuery} from '@tanstack/react-query';

import {ApiIndexerInstance} from '../../../services/api';

export const useGetTransactions = (tokenAddress: string) => {
  return useQuery({
    queryKey: ['transactions', tokenAddress],
    queryFn: async () => {
      const endpoint = `/all-transactions/${tokenAddress}`;
      const res = await ApiIndexerInstance.get(endpoint);
      if (res.status !== 200) {
        throw new Error('Failed to fetch token transactions');
      }
      return res.data;
    },
  });
};
