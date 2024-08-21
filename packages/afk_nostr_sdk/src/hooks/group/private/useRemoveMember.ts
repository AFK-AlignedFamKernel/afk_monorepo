import { useMutation} from '@tanstack/react-query';
import {useNostrContext} from '../../../context/NostrContext';
import { useAuth } from '../../../store';

export type UseRemoveMemberOptions = {
  authors?: string[];
  search?: string;
};

// TODO
export const useRemoveMember = (options?: UseRemoveMemberOptions) => {
  const {ndk} = useNostrContext();
  const {publicKey} = useAuth()

  return useMutation({
    mutationKey: ['removeMemberGroup', ndk],
    mutationFn: async (data: {pubkey: string}) => {
     

    },
  });
};
