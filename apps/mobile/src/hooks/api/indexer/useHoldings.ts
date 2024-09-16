import {useQuery} from '@tanstack/react-query';

import {ApiIndexerInstance} from '../../../services/api';

export const useGetHoldings = (tokenAddress: string) => {
  return useQuery({
    queryKey: ['token_distribution', tokenAddress],
    queryFn: async () => {
      const endpoint = `/token_distribution/${tokenAddress}`;
      const res = await ApiIndexerInstance.get(endpoint);

      if (res.status !== 200) {
        throw new Error('Failed to fetch holdings');
      }

      return res.data;
    },
  });
};
