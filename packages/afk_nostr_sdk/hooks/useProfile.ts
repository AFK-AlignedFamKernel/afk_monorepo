import {useQuery} from '@tanstack/react-query';
<<<<<<<< HEAD:packages/afk_nostr_sdk/src/hooks/useProfile.ts
import {useNostrContext} from '../context/NostrContext';
========

// import {useNostrContext} from '../../context/NostrContext';

import {useNostrContext} from '../context/NostrContext';

import {useAuth} from '../store/auth';
>>>>>>>> main:packages/afk_nostr_sdk/hooks/useProfile.ts
export type UseProfileOptions = {
  publicKey?: string;
};

export const useProfile = (options: UseProfileOptions) => {
  const {ndk} = useNostrContext();

  return useQuery({
    queryKey: ['profile', options.publicKey, ndk],
    queryFn: async () => {
      const user = ndk.getUser({pubkey: options.publicKey});

      return user.fetchProfile();
    },
    placeholderData: {} as any,
  });
};
