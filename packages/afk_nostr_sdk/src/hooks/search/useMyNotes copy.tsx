import {NDKKind} from '@nostr-dev-kit/ndk';
import {useInfiniteQuery} from '@tanstack/react-query';

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

export const useMyNotes = (options?: UseSearch) => {
  const {ndk} = useNostrContext();
  const {publicKey} = useAuth();

  return useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['search', options?.authors, options?.search, options?.kind, options?.kinds, ndk],
    getNextPageParam: (lastPage: any, allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;

      const pageParam = lastPage[lastPage.length - 1].created_at - 1;

      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    queryFn: async ({pageParam}) => {
      console.log('search query', options?.search);
      // const notes = await ndk.fetchEvents({
      const notes = await ndk.fetchEvents({
        kinds: options?.kinds ?? [options?.kind ?? NDKKind.Text],
        authors: options?.authors ?? [publicKey],
        search: options?.search,
        // content: options?.search,
        until: pageParam || Math.round(Date.now() / 1000),
        limit: options?.limit ?? 30,
      });
      console.log('notes', notes);

      return [...notes];
      // return [...notes].filter((note) => note.tags.every((tag) => tag[0] !== 'e'));
    },
    placeholderData: {pages: [], pageParams: []},
  });
};

export default useMyNotes;
