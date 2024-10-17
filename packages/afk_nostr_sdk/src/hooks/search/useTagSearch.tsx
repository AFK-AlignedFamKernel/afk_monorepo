// useSearchUsers.ts
import {NDKKind} from '@nostr-dev-kit/ndk';
import {useInfiniteQuery} from '@tanstack/react-query';

import {useNostrContext} from '../../context/NostrContext';
interface UseSearchTag {
  authors?: string[];
  search?: string;
  kind?: NDKKind;
  kinds?: NDKKind[];
  limit?: number;
  hashtag?: string; // New option for hashtag search
}
export const useSearchTag = (options?: UseSearchTag) => {
  const {ndk} = useNostrContext();

  return useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['searchHashTag', options?.authors, options?.search, options?.hashtag],
    getNextPageParam: (lastPage: any, allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;

      const pageParam = lastPage[lastPage.length - 1].created_at - 1;

      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    queryFn: async ({pageParam}) => {
      const notes = await ndk.fetchEvents({
        kinds: options?.kinds ?? [options?.kind ?? NDKKind.Text],
        authors: options?.authors,
        search: options?.search,
        until: pageParam || Math.round(Date.now() / 1000),
        '#t': [options?.hashtag],
        limit: options?.limit ?? 20,
      });

      return [...notes];
    },
    placeholderData: {pages: [], pageParams: []},
  });
};
