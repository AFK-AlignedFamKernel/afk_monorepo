import {useMutation} from '@tanstack/react-query';

import {ApiIndexerInstance} from '../../services/api';

export const useLogin = () => {
  return useMutation({
    mutationKey: ['auth_login'],
    mutationFn: (payload: {userAddress: string}) => {
      return ApiIndexerInstance.post('/auth', {...payload});
    },
  });
};
