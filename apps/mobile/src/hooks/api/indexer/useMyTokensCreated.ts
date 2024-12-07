import {useQuery} from '@tanstack/react-query';
import {ApiIndexerInstance} from '../../../services/api';

export const useMyTokensCreated = (launch?: string) => {
  return useQuery({
    queryKey: launch ? ['token', launch] : ['deploy_launch'],
    queryFn: async () => {
      const endpoint = launch ? `/deploy-token/${launch}` : '/deploy-token';
      const res = await ApiIndexerInstance.get(endpoint);

      if (res.status !== 200) {
        throw new Error('Failed to fetch token launch');
      }

      return res.data;
    },
  });
};
