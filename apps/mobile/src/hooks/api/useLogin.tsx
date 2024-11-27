import {useMutation, useQuery} from '@tanstack/react-query';

import {ApiIndexerInstance} from '../../services/api';

type Signature = {
  r: bigint;
  s: bigint;
};
type PayloadType = {
  userAddress: string;
  signature: Signature;
  loginType: 'starknet' | 'eth' | 'others';
  signedData: string;
};

export const useLogin = () => {
  return useMutation({
    mutationKey: ['auth_login'],
    mutationFn: (payload: PayloadType) => {
      return ApiIndexerInstance.post('/auth', {
        ...payload,
        signature: {
          r: payload.signature.r.toString(),
          s: payload.signature.s.toString(),
        },
      });
    },
  });
};

export const useGetAuthUser = (shouldFetch = true) => {
  return useQuery({
    queryKey: ['auth_user'],
    queryFn: async () => {
      return ApiIndexerInstance.get('/me');
    },
    enabled: !!shouldFetch,
  });
};
