import { NDKKind } from '@nostr-dev-kit/ndk';
import { InfiniteData, useInfiniteQuery, UseInfiniteQueryResult } from '@tanstack/react-query';

import { useNostrContext } from '../../context/NostrContext';

export type UseReplyNotesOptions = {
  noteId?: string;
  channelId?: string;
  authors?: string[];
  search?: string;
  limit?: number;
};

export const useMessagesChannels = (options?: UseReplyNotesOptions): UseInfiniteQueryResult<InfiniteData<any, any>, Error> => {
  const { ndk } = useNostrContext();

  return useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['messagesChannels', options?.noteId, options?.authors, options?.search, ndk],
    getNextPageParam: (lastPage: any, allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;

      const pageParam = lastPage[lastPage.length - 1].created_at - 1;

      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    queryFn: async ({ pageParam }) => {
      const notes = await ndk.fetchEvents({
        kinds: [NDKKind.ChannelMessage],
        authors: options?.authors,
        search: options?.search,
        until: pageParam || Math.round(Date.now() / 1000),
        limit: options?.limit || 20,
        '#e': options?.noteId ? [options.noteId] : undefined,
      });

      return [...notes]
        .sort((a, b) => a.created_at - b.created_at)
        // .filter((note) => note.tags.every((tag) => tag[0] === 'e'));
    },
    placeholderData: { pages: [], pageParams: [] },
  });
};
