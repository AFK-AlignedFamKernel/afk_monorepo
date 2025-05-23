import {useQuery} from '@tanstack/react-query';

import {useNostrContext} from '../context/NostrContext';
export type UseProfileOptions = {
  publicKey?: string;
};

export const useProfileUser = (options: UseProfileOptions) => {
  const {ndk} = useNostrContext();

  return useQuery({
    queryKey: ['profileUser', options.publicKey, ndk],
    queryFn: async () => {
      const user = ndk.getUser({pubkey: options.publicKey});

      return user;
    },
    placeholderData: {} as any,
  });
};
