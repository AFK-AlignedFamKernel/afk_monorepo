// useSearchUsers.ts
import {NDKKind} from '@nostr-dev-kit/ndk';
import {useInfiniteQuery} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';

export type UseSearchUsers = {
  authors?: string[];
  search?: string;
  kind?: NDKKind;
};

export const useSearchUsers = (options?: UseSearchUsers) => {
  const {ndk} = useNostrContext();

  return useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['search_user', options?.authors, options?.search, ndk],
    getNextPageParam: (lastPage: any, allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;

      const pageParam = lastPage[lastPage.length - 1].created_at - 1;

      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    queryFn: async ({pageParam}) => {
      const notes = await ndk.fetchEvents({
        kinds: [options?.kind ?? NDKKind.Text],
        authors: options?.authors,
        search: options?.search,
        until: pageParam || Math.round(Date.now() / 1000),
        limit: 20,
      });

      // return [...notes].filter((note) => note.tags.every((tag) => tag[0] !== 'e'));
      return [...notes];
    },
    placeholderData: {pages: [], pageParams: []},
  });
};

export default useSearchUsers;
