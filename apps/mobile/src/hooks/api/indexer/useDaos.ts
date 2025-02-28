import { useQuery } from '@tanstack/react-query';

import { ApiIndexerInstance } from '../../../services/api';

export const useDaoList = () => {
  return useQuery({
    queryKey: ['daos'],
    queryFn: async () => {
      const endpoint = `/daos`;
      const res = await ApiIndexerInstance.get(endpoint);

      if (res.status !== 200) {
        throw new Error('Failed to fetch daos');
      }

      return res.data;
    },
  });
};

export const useDao = (daoAddress: string) => {
  return useQuery({
    queryKey: ['dao', daoAddress],
    queryFn: async () => {
      const endpoint = `/daos/${daoAddress}`;
      const res = await ApiIndexerInstance.get(endpoint);

      if (res.status !== 200) {
        throw new Error('Failed to fetch daos');
      }

      return res.data;
    },
  });
};
