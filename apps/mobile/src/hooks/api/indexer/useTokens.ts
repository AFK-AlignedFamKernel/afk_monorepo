import {useQuery} from '@tanstack/react-query';

import {ApiIndexerInstance} from '../../../services/api';

export const useTokens = (launch?: string) => {
  return useQuery({
    queryKey: launch ? ['launch', launch] : ['deploy_token'],
    queryFn: async () => {
      const endpoint = "deploy";
      const res = await ApiIndexerInstance.get(endpoint);

      if (res.status !== 200) {
        throw new Error('Failed to fetch token launch');
      }

      return res.data;
    },
  });
};
