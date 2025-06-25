import {useQuery} from '@tanstack/react-query';

import {ApiIndexerInstance} from '../../../services/api';

export const useGetShares = (tokenAddress: string, userId?: string) => {
  return useQuery({
    queryKey: ['user_shares', tokenAddress, userId],
    queryFn: async () => {
      try {
        if (!userId) {
          return {
            status: 500,
            message: 'NO_USER_CONNECTED',
          };
        }
        const endpoint = `/share-user/${userId}/${tokenAddress}`;
        const res = await ApiIndexerInstance.get(endpoint);
  
        if (res.status !== 200) {
          throw new Error('Failed to fetch token share by owner');
        }
  
        return res.data;        
      } catch (error) {
        console.log("error", error);
      }

    },
  });
};
