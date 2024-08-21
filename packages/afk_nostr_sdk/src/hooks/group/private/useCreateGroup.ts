import { useMutation } from '@tanstack/react-query';
import { useNostrContext } from '../../../context/NostrContext';
import { useAuth } from '../../../store';

export type UseCreateGroupOptions = {
  authors?: string[];
  search?: string;
};

// TODO
export const useCreateGroup = (options?: UseCreateGroupOptions) => {
  const { ndk } = useNostrContext();
  const { publicKey } = useAuth()

  return useMutation({
    mutationKey: ['createGroup', ndk],
    mutationFn: async (data: { pubkey: string }) => {


    },
  });
};
