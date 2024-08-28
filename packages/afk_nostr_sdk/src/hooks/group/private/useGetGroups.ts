import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useInfiniteQuery} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';

interface UseGetActiveGroupListOptions {
  pubKey: string;
  search?: string;
  limit?: number;
}

export const useGetGroupList = (options: UseGetActiveGroupListOptions) => {
  const {ndk} = useNostrContext();
  const GroupAdminDeleteGroup: any = 9008;
  const groupMap = new Map<string, NDKEvent>();
  return useInfiniteQuery({
    queryKey: ['getAllGroups', options.pubKey, options?.search],
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;

      const pageParam = lastPage[lastPage.length - 1].created_at - 1;
      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    queryFn: async ({pageParam}) => {
      const events = await ndk.fetchEvents({
        kinds: [NDKKind.GroupAdminCreateGroup, GroupAdminDeleteGroup, 39000],
        authors: [options.pubKey],
        until: pageParam || Math.round(Date.now() / 1000),
        limit: options?.limit || 20,
        search: options?.search,
      });

      [...events]
        .sort((a, b) => a.created_at - b.created_at)
        .forEach((event) => {
          if (event.kind === NDKKind.GroupAdminCreateGroup) {
            const groupId = event.tags.find((tag) => tag[0] === 'd')?.[1] || event?.id;
            if (groupId) {
              groupMap.set(groupId, event);
            }
          } else if (event.kind === GroupAdminDeleteGroup) {
            const groupId = event.tags.find((tag) => tag[0] === 'd')?.[1];
            if (groupId) {
              groupMap.delete(groupId);
            }
          }
        });

      const activeGroups = Array.from(groupMap.values()).sort(
        (a, b) => b.created_at - a.created_at,
      );

      return activeGroups;
    },

    placeholderData: {pages: [], pageParams: []},
  });
};
