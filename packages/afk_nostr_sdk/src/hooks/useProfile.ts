import {useQuery} from '@tanstack/react-query';

import {useNostrContext} from '../context/NostrContext';
export type UseProfileOptions = {
  publicKey?: string;
};

export const useProfile = (options: UseProfileOptions) => {
  const {ndk} = useNostrContext();

  return useQuery({
    queryKey: ['profile', options.publicKey, ndk],
    queryFn: async () => {

      if(!options.publicKey) {
        return null
      }

      if(ndk.pool?.connectedRelays().length === 0) {
        await ndk.connect(5000)
      }

      const user = ndk.getUser({pubkey: options.publicKey});

      // console.log("user", user)

      const profile = await user.fetchProfile();

      // console.log("profile", profile)

      return profile;
    },
    placeholderData: {} as any,
  });
};

export const useProfileMetadata = (options: UseProfileOptions) => {
  const {ndk} = useNostrContext();

  return useQuery({
    queryKey: ['profile', options.publicKey, ndk],
    queryFn: async () => {

      if(!options.publicKey) {
        return null
      }

      if(ndk.pool?.connectedRelays().length === 0) {
        await ndk.connect(5000)
      }

      const user = ndk.getUser({pubkey: options.publicKey});

      // console.log("user", user)

      const profile = await user.fetchProfile();

      // console.log("profile", profile)

      return profile;
    },
    placeholderData: {} as any,
  });
};

