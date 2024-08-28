import {NDKKind} from '@nostr-dev-kit/ndk';
import {useInfiniteQuery} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';

interface UseGetActiveGroupListOptions {
  search?: string;
  limit?: number;
  groupId: string;
}

export const useGetGroupMessages = (options: UseGetActiveGroupListOptions) => {
  const {ndk} = useNostrContext();

  return useInfiniteQuery({
    queryKey: ['getGroupMessages', options.groupId, options?.search],
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;

      const pageParam = lastPage[lastPage.length - 1].created_at - 1;
      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    queryFn: async ({pageParam}) => {
      const events = await ndk.fetchEvents({
        kinds: [NDKKind.GroupNote],
        until: pageParam || Math.round(Date.now() / 1000),
        limit: options?.limit || 20,
        search: options?.search,
        '#h': [options.groupId],
      });

      return events ?? null;
    },

    placeholderData: {pages: [], pageParams: []},
  });
};
