import {useQuery} from '@tanstack/react-query';

import {ApiIndexerInstance} from '../../../services/api';

export const useGetHoldings = (tokenAddress: string) => {
  return useQuery({
    queryKey: ['token_distribution', tokenAddress],
    queryFn: async ({queryKey}) => {
      const [_, tokenAddress] = queryKey;
      const endpoint = `/token-distribution/${tokenAddress}`;
      const res = await ApiIndexerInstance.get(endpoint);
      console.log('res', res);

      if (res.status !== 200) {
        throw new Error('Failed to fetch holdings');
      }

      return res.data;
    },
  });
};
