import {useQuery} from '@tanstack/react-query';

import {ApiIndexerInstance} from '../../../services/api';

export const useGetDeployToken = (token: string) => {
  return useQuery({
    queryKey: token ? ['deploy_token', token] : ['deploy_token'],
    queryFn: async () => {
      const endpoint = token ? `/deploy/${token}` : '/deploy';
      const res = await ApiIndexerInstance.get(endpoint);

      if (res.status !== 200) {
        throw new Error('Failed to fetch deploy token');
      }

      return res.data;
    },
  });
};
