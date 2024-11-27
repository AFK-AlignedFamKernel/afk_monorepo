import {useMutation, useQuery} from '@tanstack/react-query';

import {ApiIndexerInstance} from '../../services/api';

type IConnectPayload = {
  userId: string;
  codeVerifier: string;
  code: string;
};

export const useGetTwitterAuthorizationLink = (url: boolean) => {
  return useQuery({
    queryKey: ['login_twitter'],
    queryFn: () => {
      return ApiIndexerInstance.get('/twitter/auth/login');
    },
    enabled: !!url,
  });
};

export const useConnectTwitter = () => {
  return useMutation({
    mutationKey: ['connect_twitter'],
    mutationFn: (payload: IConnectPayload) => {
      return ApiIndexerInstance.post('/twitter/connect-account', payload);
    },
  });
};

export const useDisconnectTwitter = () => {
  return useMutation({
    mutationKey: ['disconnect_twitter'],
    mutationFn: (userId: string) => {
      return ApiIndexerInstance.post('/twitter/disconnect', {userId});
    },
  });
};
