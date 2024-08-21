import { useMutation } from '@tanstack/react-query';
import { useNostrContext } from '../../../context/NostrContext';
import { useAuth } from '../../../store';

export type UseSendGroupMessages = {
  authors?: string[];
  search?: string;
};

// TODO
export const useSendGroupMessages = (options?: UseSendGroupMessages) => {
  const { ndk } = useNostrContext();
  const { publicKey } = useAuth()

  return useMutation({
    mutationKey: ['sendMessageGroup', ndk],
    mutationFn: async (data: { pubkey: string }) => {


    },
  });
};
