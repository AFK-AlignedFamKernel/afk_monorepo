import { NDKKind } from '@nostr-dev-kit/ndk';
import { useQuery } from '@tanstack/react-query';

import { useNostrContext } from '../context/NostrContext';
import { useAuth } from '../store/auth';

export type UseContactsOptions = {
  authors?: string[];
  search?: string;
};

export const useContacts = (options?: UseContactsOptions) => {
  const { ndk } = useNostrContext();
  const { publicKey } = useAuth();
  return useQuery({
    queryKey: ['contacts', options?.authors, options?.search, ndk],
    queryFn: async () => {
      const contacts = await ndk.fetchEvent({
        kinds: [NDKKind.Contacts],
        authors: [publicKey,
          //  ...options?.authors

        ],
        search: options?.search,
      });

      console.log("contacts", contacts)
      return contacts?.tags.filter((tag) => tag[0] === 'p').map((tag) => tag[1]) ?? [];
    },
    placeholderData: [],
  });
};
