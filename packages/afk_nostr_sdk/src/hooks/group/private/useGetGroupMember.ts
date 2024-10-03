import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useInfiniteQuery} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {useAuth} from '../../../store';

interface UseGetGroupListOptions {
  limit?: number;
  search?: string;
  groupId: string;
}

interface UseGetGroupListOptions {
  limit?: number;
  search?: string;
  groupId: string;
}

export const useGetGroupMemberList = (options: UseGetGroupListOptions) => {
  const {ndk} = useNostrContext();

  return useInfiniteQuery({
    queryKey: ['getAllGroupMember', options.search, options.groupId],
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
        kinds: [NDKKind.GroupAdminAddUser, NDKKind.GroupAdminRemoveUser],
        '#d': [options.groupId],
        until: pageParam || Math.round(Date.now() / 1000),
        limit: options?.limit || 20,
        search: options?.search,
      });

      const memberMap = new Map<string, any>();

      [...events]
        .sort((a, b) => (a.created_at && b.created_at ? a.created_at - b.created_at : 0))
        .forEach((event) => {
          const pubkey = event.tags.find((tag) => tag[0] === 'p')?.[1];
          if (!pubkey) return;

          if (event.kind === NDKKind.GroupAdminAddUser) {
            memberMap.set(pubkey, {...event, isRemoved: false});
          } else if (event.kind === NDKKind.GroupAdminRemoveUser) {
            const existingMember = memberMap.get(pubkey);
            if (existingMember) {
              memberMap.set(pubkey, {...existingMember, isRemoved: true});
            }
          }
        });

      const currentMembers = Array.from(memberMap.values())
        .filter((member) => !member.isRemoved)
        .sort((a, b) => (a.created_at && b.created_at ? b.created_at - a.created_at : 0));

      return currentMembers;
    },
    placeholderData: {pages: [], pageParams: []},
  });
};

export const useGetGroupRequest = (options: UseGetGroupListOptions) => {
  const {ndk} = useNostrContext();
  const memberListQuery = useGetGroupMemberList(options);
  return useInfiniteQuery({
    queryKey: ['getGroupRequest', options.search, options.groupId],
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
        kinds: [NDKKind.GroupAdminRequestJoin],
        '#h': [options.groupId],
        until: pageParam || Math.round(Date.now() / 1000),
        limit: options?.limit || 20,
      });
      // Wait for the member list to be available
      await memberListQuery.refetch();

      const memberPubkeys = new Set(
        memberListQuery.data?.pages
          // @ts-ignore
          .flatMap((page) =>
            // @ts-ignore
            page.map((member: any) => member.tags.find((tag: any) => tag[0] === 'p')?.[1]),
          )
          .filter(Boolean),
      );

      // Use a Map to keep track of the latest request from each user
      const latestRequests = new Map<string, NDKEvent>();

      [...events].forEach((event) => {
        const requestPubkey = event.tags.find((tag) => tag[0] === 'p')?.[1];
        if (requestPubkey && !memberPubkeys.has(requestPubkey)) {
          const existingRequest = latestRequests.get(requestPubkey);
          if (
            !existingRequest ||
            (event.created_at &&
              existingRequest.created_at &&
              event.created_at > existingRequest.created_at)
          ) {
            latestRequests.set(requestPubkey, event);
          }
        }
      });

      // Convert the Map values to an array and sort by creation time (newest first)
      const uniqueFilteredEvents = Array.from(latestRequests.values()).sort((a, b) =>
        a.created_at && b.created_at ? b.created_at - a.created_at : 0,
      );

      return uniqueFilteredEvents;
    },
    placeholderData: {pages: [], pageParams: []},
  });
};

export const useGetGroupMemberListPubkey = (options: UseGetGroupListOptions) => {
  const {ndk} = useNostrContext();
  const {publicKey} = useAuth();

  return useInfiniteQuery({
    queryKey: ['getAllGroupMember', publicKey, options.search, options.groupId],
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
        kinds: [NDKKind.GroupAdminAddUser, NDKKind.GroupAdminRemoveUser],
        authors: [publicKey],
        '#d': [options.groupId],
        until: pageParam || Math.round(Date.now() / 1000),
        limit: options?.limit || 20,
        search: options?.search,
      });

      const memberMap = new Map<string, any>();

      [...events]
        .sort((a, b) => (a.created_at && b.created_at ? a.created_at - b.created_at : 0))
        .forEach((event) => {
          const pubkey = event.tags.find((tag) => tag[0] === 'p')?.[1];
          if (!pubkey) return;

          if (event.kind === NDKKind.GroupAdminAddUser) {
            memberMap.set(pubkey, {...event, isRemoved: false});
          } else if (event.kind === NDKKind.GroupAdminRemoveUser) {
            const existingMember = memberMap.get(pubkey);
            if (existingMember) {
              // memberMap.set(pubkey, {...existingMember, isRemoved: true});
              memberMap.delete(pubkey);
            }
          }
        });

      const currentMembers = Array.from(memberMap.values())
        .filter((member) => !member.isRemoved)
        .sort((a, b) => b.created_at - a.created_at);

      return currentMembers;
    },
    placeholderData: {pages: [], pageParams: []},
  });
};
