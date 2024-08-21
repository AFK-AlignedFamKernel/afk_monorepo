import {useMutation} from '@tanstack/react-query';
import {useNostrContext} from '../../../context/NostrContext';
import { useAuth } from '../../../store';

export type UseRemovePermissionsOptions = {
  authors?: string[];
  search?: string;
};

// TODO
export const useRemovePermissions = (options?: UseRemovePermissionsOptions) => {
  const {ndk} = useNostrContext();
  const {publicKey} = useAuth()

  return useMutation({
    mutationKey: ['removePermissions', ndk],
    mutationFn: async (data: {pubkey: string}) => {
     

    },
  });
};
