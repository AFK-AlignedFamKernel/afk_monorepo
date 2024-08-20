import {useQuery} from '@tanstack/react-query';

import {ApiIndexerInstance} from '../../../services/api';

export const useGetTokenLaunch = () => {
  return useQuery({
    // mutationKey: ['token_launch'],
    // queryFn: () => {
    //   return ApiIndexerInstance.get('/deploy-launch', {});
    // },
    queryKey: ['token_launch'],
    queryFn: async () => {
      const res = await ApiIndexerInstance.get('/deploy-launch');
      // console.log("res get launch",res)
      return res;
    },
  });
};
