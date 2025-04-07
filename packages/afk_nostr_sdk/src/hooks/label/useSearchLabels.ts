import { NDKKind } from '@nostr-dev-kit/ndk';
import { useInfiniteQuery } from '@tanstack/react-query';

import { useNostrContext } from '../../context/NostrContext';

export type UseRootNotesOptions = {
  authors?: string[];
  search?: string;
  kinds?: NDKKind[];
  limit?: number;
};

export const useSearchLabels = (options?: UseRootNotesOptions) => {
  const { ndk } = useNostrContext();

  return useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['getSearchLabels', options?.authors, options?.search, ndk],
    getNextPageParam: (lastPage: any, allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;

      const lastNote = lastPage[lastPage.length - 1];
      // console.log('created_at', lastNote.created_at);
      const pageParam = lastNote.created_at - 1;
      // console.log('pageParam', pageParam);

      return pageParam;
      // if (!lastPage?.length) return undefined;

      // const pageParam = lastPage[lastPage.length - 1].created_at - 1;

      // if (!pageParam || pageParam === lastPageParam) return undefined;

      // return pageParam;
    },
    queryFn: async ({ pageParam }) => {

      const sinceTimestamp = pageParam
        ? pageParam - 1 * 60 * 60 * 24 :// Restart from pageParam minus 1 hour
        Math.round(Date.now() / 1000) - 1 * 60 * 60 * 24; // Start from 1 hour ago


      const notes = await ndk.fetchEvents({
        kinds: options?.kinds ?? [NDKKind.Label],
        authors: options?.authors,
        search: options?.search,
        since: sinceTimestamp,
        until: pageParam || Math.round(Date.now() / 1000),
        limit: options?.limit ?? 20,
      });

      return [...notes];
    },
    placeholderData: { pages: [], pageParams: [] },
  });
};
