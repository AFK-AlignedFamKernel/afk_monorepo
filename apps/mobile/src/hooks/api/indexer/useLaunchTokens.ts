import {useQuery} from '@tanstack/react-query';

import {ApiIndexerInstance} from '../../../services/api';

export const useGetTokenLaunch = (launch: string) => {
  return useQuery({
    queryKey: launch ? ['deploy_launch', launch] : ['deploy_launch'],
    queryFn: async () => {
      const endpoint = launch ? `/deploy-launch/${launch}` : '/deploy-launch';
      const res = await ApiIndexerInstance.get(endpoint);

      if (res.status !== 200) {
        throw new Error('Failed to fetch token launch');
      }

      return res.data;
    },
  });
};
