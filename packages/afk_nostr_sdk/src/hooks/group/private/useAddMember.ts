import {useMutation} from '@tanstack/react-query';
import {useNostrContext} from '../../../context/NostrContext';
import { useAuth } from '../../../store';

export type UseAddMemberOptions = {
  authors?: string[];
  search?: string;
};

// TODO
export const useAddMember = (options?: UseAddMemberOptions) => {
  const {ndk} = useNostrContext();
  const {publicKey} = useAuth()

  return useMutation({
    mutationKey: ['addMemberGroup', ndk],
    mutationFn: async (data: {pubkey: string}) => {
     

    },
  });
};
