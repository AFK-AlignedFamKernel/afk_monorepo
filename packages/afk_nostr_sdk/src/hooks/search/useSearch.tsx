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
};

export const useSearch = (options?: UseSearch):UseInfiniteQueryResult<any> => {
  const { ndk } = useNostrContext();

  return useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['search', options?.authors, options?.search, options?.kind, options?.kinds, options?.isWithouthReply, ndk],
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
      // console.log('search query', options?.search);

      // Calculate the 'since' timestamp (24 hours ago)
      // const sinceTimestamp = Math.round(Date.now() / 1000) - 24 * 60 * 60;

      // Calculate the 'since' timestamp
      const sinceTimestamp = pageParam
        ? pageParam - 1 * 60 * 60 :// Restart from pageParam minus 1 hour
          Math.round(Date.now() / 1000) - 1 * 60 * 60; // Start from 1 hour ago

      // const sinceTimestamp = pageParam
      // ? pageParam - 24 * 60 * 60 :// Restart from pageParam minus 24 hours
      //   Math.round(Date.now() / 1000) - 24 * 60 * 60; // Start from 24 hours ago

      // const notes = await ndk.fetchEvents({
      const notes = await ndk.fetchEvents({
        kinds: options?.kinds ?? [options?.kind ?? NDKKind.Text],
        // authors: options?.authors ?? [], # TODO fix issue feed if authors is empty
        search: options?.search,
        since: options?.since ? options?.since : sinceTimestamp,
        // content: options?.search,
        until: pageParam || Math.round(Date.now() / 1000),
        limit: options?.limit ?? 20,
      });
      // console.log('notes', notes);

      return [...notes];
      // return [...notes].filter((note) => note.tags.every((tag) => tag[0] !== 'e'));
    },
    placeholderData: { pages: [], pageParams: [] },
  });
};

export default useSearch;
