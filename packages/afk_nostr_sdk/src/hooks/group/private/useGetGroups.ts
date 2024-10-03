import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useInfiniteQuery} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';

interface UseGetActiveGroupListOptions {
  pubKey?: string | undefined;
  search?: string;
  limit?: number;
}

/**
 * Use this hooks to get all Private Group List that has not been deleted
 * This Hooks uses originalId key to keep track of each group because a group can have multiple edits
 * @param options
 * @returns
 */
export const useGetGroupList = (options: UseGetActiveGroupListOptions) => {
  const {ndk} = useNostrContext();
  const GroupAdminDeleteGroup: any = 9008;
  const groupMap = new Map<string, {event: NDKEvent; originalGroupId: string}>();

  return useInfiniteQuery({
    queryKey: ['getAllGroups', options.pubKey, options?.search],
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      // @ts-ignore
      if (!lastPage?.length) return undefined;

      // @ts-ignore
      const pageParam = lastPage[lastPage.length - 1].created_at - 1;
      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    // @ts-ignore
    queryFn: async ({pageParam}) => {
      const events = await ndk.fetchEvents({
        kinds: [
          NDKKind.GroupAdminCreateGroup,
          GroupAdminDeleteGroup,
          NDKKind.GroupAdminEditMetadata,
        ],
        // authors: options?.pubKey ? [options.pubKey]: [],
        until: pageParam || Math.round(Date.now() / 1000),
      });
      [...events]
        .sort((a, b) => (a.created_at && b.created_at ? a.created_at - b.created_at : 0))
        .forEach((event) => {
          let groupId: string;

          if (event.kind === NDKKind.GroupAdminCreateGroup) {
            groupId = event.id;
            groupMap.set(groupId, {event, originalGroupId: groupId});
          } else if (event.kind === NDKKind.GroupAdminEditMetadata) {
            groupId = event.tags.find((tag) => tag[0] === 'd')?.[1] || '';
            if (groupId && groupMap.has(groupId)) {
              const originalGroupId = groupMap.get(groupId)!.originalGroupId;
              groupMap.set(groupId, {event, originalGroupId});
            }
          } else if (event.kind === GroupAdminDeleteGroup) {
            groupId = event.tags.find((tag) => tag[0] === 'd')?.[1] || '';
            if (groupId) {
              groupMap.delete(groupId);
            }
          }
        });

      const activeGroups = Array.from(groupMap.values())
        .map(({event, originalGroupId}) => ({
          ...event,
          originalGroupId,
        }))
        .sort((a, b) => (b.created_at && a.created_at ? b.created_at - a.created_at : 0));

      return activeGroups;
    },
    placeholderData: {pages: [], pageParams: []},
  });
};

/**
 * This hooks returns all groups added by admin.
 * @param options
 * @returns
 */
export const useGetAllGroupList = (options: UseGetActiveGroupListOptions) => {
  const {ndk} = useNostrContext();

  return useInfiniteQuery({
    queryKey: ['getAllGroupLists', options.pubKey, options?.search],
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      // @ts-ignore
      if (!lastPage?.length) return undefined;

      // @ts-ignore
      const pageParam = lastPage[lastPage.length - 1].created_at - 1;
      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    // @ts-ignore
    queryFn: async ({pageParam}) => {
      const events = await ndk.fetchEvents({
        kinds: [NDKKind.GroupAdminAddUser],
        until: pageParam || Math.round(Date.now() / 1000),
      });

      return [...events];
    },
    placeholderData: {pages: [], pageParams: []},
  });
};

/**
 * This hooks returns all groups added by admin.
 * @param options
 * @returns
 */
export const useGetAllGroupListByMemberAdded = (options: UseGetActiveGroupListOptions) => {
  const {ndk} = useNostrContext();

  return useInfiniteQuery({
    queryKey: ['getAllGroupLists', options.pubKey, options?.search],
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      // @ts-ignore
      if (!lastPage?.length) return undefined;

      // @ts-ignore
      const pageParam = lastPage[lastPage.length - 1].created_at - 1;
      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    // @ts-ignore
    queryFn: async ({pageParam}) => {
      const events = await ndk.fetchEvents({
        kinds: [NDKKind.GroupAdminAddUser],
        until: pageParam || Math.round(Date.now() / 1000),
      });

      return [...events];
    },
    placeholderData: {pages: [], pageParams: []},
  });
};
