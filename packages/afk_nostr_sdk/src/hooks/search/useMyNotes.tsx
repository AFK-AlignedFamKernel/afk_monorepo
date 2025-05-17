import {NDKKind} from '@nostr-dev-kit/ndk';
import {InfiniteData, useInfiniteQuery, UseInfiniteQueryResult} from '@tanstack/react-query';

import {useNostrContext} from '../../context/NostrContext';
import { useAuth } from '../../store';

export type UseSearch = {
  authors?: string[];
  search?: string;
  kind?: NDKKind;
  kinds?: NDKKind[];
  sortBy?: string;
  limit?: number;
};

export const useMyNotes = (options?: UseSearch):UseInfiniteQueryResult<InfiniteData<any, any>, Error>=> {
  const {ndk} = useNostrContext();
  const {publicKey} = useAuth();

  return useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['search', options?.authors, options?.search, options?.kind, options?.kinds, ndk],
    getNextPageParam: (lastPage: any, allPages) => {
      if (!lastPage?.length) return undefined;

      const lastNote = lastPage[lastPage.length - 1];
      // console.log('created_at', lastNote.created_at);
      const pageParam = lastNote.created_at - 1;
      // console.log('pageParam', pageParam);

      return pageParam;
    },
    queryFn: async ({pageParam}) => {
      // console.log('search query', options?.search);
      // console.log('pageParam', pageParam);
      const notes = await ndk.fetchEvents({
        kinds: options?.kinds ?? [options?.kind ?? NDKKind.Text],
        authors: options?.authors ?? [publicKey],
        search: options?.search,
        until: pageParam || Math.round(Date.now() / 1000),
        limit: options?.limit ?? 10,
      });
      // console.log('notes', notes);

      return [...notes];
    },
    placeholderData: {pages: [], pageParams: []},
  });
};

export default useMyNotes;
