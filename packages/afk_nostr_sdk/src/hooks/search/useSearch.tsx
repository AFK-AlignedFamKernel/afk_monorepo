import { NDKKind } from '@nostr-dev-kit/ndk';
import { useInfiniteQuery, UseInfiniteQueryResult } from '@tanstack/react-query';

import { useNostrContext } from '../../context/NostrContext';

export type UseSearch = {
  authors?: string[];
  search?: string;
  kind?: NDKKind;
  kinds?: NDKKind[];
  sortBy?: string;
  limit?: number;
  isWithouthReply?: boolean;
  since?: number;
  sinceInterval?: number;
};

export const useSearch = (options?: UseSearch): UseInfiniteQueryResult<any> => {
  const { ndk } = useNostrContext();

  return useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['search', options?.authors, options?.search, options?.kind, options?.kinds, options?.isWithouthReply, ndk],
    getNextPageParam: (lastPage: any, allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;
      const lastNote = lastPage[lastPage.length - 1];
      return lastNote.created_at - 1;
    },
    queryFn: async ({ pageParam }) => {
      // Simplify timestamp logic
      const sinceTimestamp = pageParam || Math.round(Date.now() / 1000) - (24 * 60 * 60); // Default to 24 hours ago

      try {
      const notes = await ndk.fetchEvents({
        kinds: options?.kinds ?? [options?.kind ?? NDKKind.Text],
        authors: options?.authors,
        search: options?.search,
          since: sinceTimestamp,
          until: Math.round(Date.now() / 1000),
        limit: options?.limit ?? 20,
      });

      return [...notes];
      } catch (error) {
        console.error('Error fetching events:', error);
        return [];
      }
    },
    placeholderData: { pages: [], pageParams: [] },
  });
};

export default useSearch;
