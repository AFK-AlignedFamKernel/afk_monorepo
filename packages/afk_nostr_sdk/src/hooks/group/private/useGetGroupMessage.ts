import {NDKKind} from '@nostr-dev-kit/ndk';
import {useInfiniteQuery} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';

interface UseGetActiveGroupListOptions {
  search?: string;
  limit?: number;
  groupId: string;
  authors: string;
  content?: string;
}

export const useGetGroupMessages = (options: UseGetActiveGroupListOptions) => {
  const {ndk} = useNostrContext();

  return useInfiniteQuery({
    queryKey: ['getGroupMessages', options.groupId, options?.search],
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
        '#h': [options.groupId],
        kinds: [NDKKind.GroupNote, NDKKind.GroupReply],
        // authors: [options?.authors],
        search: options?.search,
        until: pageParam || Math.round(Date.now() / 1000),
        limit: options?.limit || 100,
      });

      const eventMap = new Map();
      const replyMap = new Map();

      // Single pass: Store all events and process replies
      events.forEach((event) => {
        eventMap.set(event.id, event);

        const replyTag = event.tags.find((tag) => tag[0] === 'e' && tag[3] === 'reply');
        if (replyTag) {
          const rootId = replyTag[1];
          const rootMessage = eventMap.get(rootId);
          if (rootMessage) {
            // @ts-ignore
            event['reply'] = rootMessage;
          } else {
            if (!replyMap.has(rootId)) {
              replyMap.set(rootId, []);
            }
            replyMap.get(rootId).push(event);
          }
        }
      });

      // Process any remaining replies
      replyMap.forEach((replies, rootId) => {
        const rootMessage = eventMap.get(rootId);
        if (rootMessage) {
          replies.forEach((reply: any) => {
            reply['reply'] = rootMessage;
          });
        }
      });

      return [...eventMap.values()];
    },
    placeholderData: {pages: [], pageParams: []},
  });
};
