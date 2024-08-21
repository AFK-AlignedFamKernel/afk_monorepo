import {useMutation} from '@tanstack/react-query';
import {useNostrContext} from '../../../context/NostrContext';
import { useAuth } from '../../../store';

export type UseDeleteEventGroupOptions = {
  authors?: string[];
  search?: string;
};

// TODO
export const useDeleteEvent = (options?: UseDeleteEventGroupOptions) => {
  const {ndk} = useNostrContext();
  const {publicKey} = useAuth()

  return useMutation({
    mutationKey: ['deleteEventGroup', ndk],
    mutationFn: async (data: {pubkey: string}) => {
     

    },
  });
};
