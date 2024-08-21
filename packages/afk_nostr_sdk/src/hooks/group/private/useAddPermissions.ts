import {useMutation} from '@tanstack/react-query';
import {useNostrContext} from '../../../context/NostrContext';
import { useAuth } from '../../../store';

export type UseAddPermissionsOptions = {
  authors?: string[];
  search?: string;
};

// TODO
export const useAddPermissions = (options?: UseAddPermissionsOptions) => {
  const {ndk} = useNostrContext();
  const {publicKey} = useAuth()

  return useMutation({
    mutationKey: ['addPermissions', ndk],
    mutationFn: async (data: {pubkey: string}) => {
     

    },
  });
};
