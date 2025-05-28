import { NDKKind } from '@nostr-dev-kit/ndk';
import { useInfiniteQuery, UseInfiniteQueryResult } from '@tanstack/react-query';

import { useNostrContext } from '../../context/NostrContext';

export type UseRootNotesOptions = {
  authors?: string[];
  search?: string;
  kinds?: NDKKind[];
  limit?: number;
};

export const useGetVideos = (options?: UseRootNotesOptions):UseInfiniteQueryResult<any> => {
  const { ndk } = useNostrContext();

  return useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['getVideos', options?.authors, options?.search, ndk],
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
        kinds: options?.kinds ?? [NDKKind.HorizontalVideo, NDKKind.VerticalVideo, NDKKind.ShortVideo, NDKKind.Video],
        authors: options?.authors,
        search: options?.search,
        since: sinceTimestamp,
        until: pageParam || Math.round(Date.now() / 1000),
        limit: options?.limit ?? 20,
      });

      // console.log('notes', notes);

      return [...notes];
    },
    placeholderData: { pages: [], pageParams: [] },
  });
};
