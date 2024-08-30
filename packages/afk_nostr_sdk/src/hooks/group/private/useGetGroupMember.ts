import {NDKKind} from '@nostr-dev-kit/ndk';
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
  const {publicKey} = useAuth();

  return useInfiniteQuery({
    queryKey: ['getAllGroupMember', publicKey, options.search, options.groupId],
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;
      const pageParam = lastPage[lastPage.length - 1].created_at - 1;
      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
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
        .sort((a, b) => a.created_at - b.created_at)
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
        .sort((a, b) => b.created_at - a.created_at);

      return currentMembers;
    },
    placeholderData: {pages: [], pageParams: []},
  });
};

export const useGetGroupRequest = (options: UseGetGroupListOptions) => {
  const {ndk} = useNostrContext();
  const {publicKey} = useAuth();

  return useInfiniteQuery({
    queryKey: ['getGroupRequest', publicKey, options.search, options.groupId],
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;
      const pageParam = lastPage[lastPage.length - 1].created_at - 1;
      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    queryFn: async ({pageParam}) => {
      const events = await ndk.fetchEvents({
        kinds: [9021],
        authors: [publicKey],
        '#h': [options.groupId],
        until: pageParam || Math.round(Date.now() / 1000),
        limit: options?.limit || 20,
        search: options?.search,
      });

      return [...events];
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
      if (!lastPage?.length) return undefined;
      const pageParam = lastPage[lastPage.length - 1].created_at - 1;
      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
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
        .sort((a, b) => a.created_at - b.created_at)
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