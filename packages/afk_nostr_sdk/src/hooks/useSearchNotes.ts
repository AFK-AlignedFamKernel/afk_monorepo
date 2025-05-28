import {NDKKind} from '@nostr-dev-kit/ndk';
import {InfiniteData, useInfiniteQuery, UseInfiniteQueryResult} from '@tanstack/react-query';

import {useNostrContext} from '../context/NostrContext';

export type UseRootNotesOptions = {
  authors?: string[];
  search?: string;
  kinds?: NDKKind[];
};

export const useSearchNotes = (options?: UseRootNotesOptions):UseInfiniteQueryResult<InfiniteData<any, any>, Error>=> {
  const {ndk} = useNostrContext();

  return useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['searchNotes', options?.authors, options?.search, options?.kinds, ndk],
    getNextPageParam: (lastPage: any, allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;

      const pageParam = lastPage[lastPage.length - 1].created_at - 1;

      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    queryFn: async ({pageParam}) => {
      const notes = await ndk.fetchEvents({
        kinds: options?.kinds ?? [NDKKind.Text],
        authors: options?.authors,
        search: options?.search,
        until: pageParam || Math.round(Date.now() / 1000),
        limit: 20,
      });

      return [...notes].filter((note) => note.tags.every((tag) => tag[0] !== 'e'));
    },
    placeholderData: {pages: [], pageParams: []},
  });
};
