import {NDKKind} from '@nostr-dev-kit/ndk';
import {useInfiniteQuery} from '@tanstack/react-query';

import {useNostrContext} from '../context/NostrContext';

export type UseRootProfilesOptions = {
  authors?: string[];
  search?: string;
  limit?: number;
};

export const useAllProfiles = (options?: UseRootProfilesOptions) => {
  const {ndk} = useNostrContext();

  return useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['rootProfiles', options?.authors, options?.search, ndk],
    getNextPageParam: (lastPage: any, allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;

      const pageParam = lastPage[lastPage.length - 1].created_at - 1;

      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    queryFn: async ({pageParam}) => {
      const notes = await ndk.fetchEvents({
        kinds: [NDKKind.Metadata],
        authors: options?.authors,
        search: options?.search,
        until: pageParam || Math.round(Date.now() / 1000),
        limit: options?.limit ?? 20,
      });

      return [...notes].filter((note) => note.tags.every((tag) => tag[0] !== 'e'));
    },
    placeholderData: {pages: [], pageParams: []},
  });
};
