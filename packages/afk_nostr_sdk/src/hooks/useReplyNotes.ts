import {NDKKind} from '@nostr-dev-kit/ndk';
import {InfiniteData, useInfiniteQuery, UseInfiniteQueryResult} from '@tanstack/react-query';

import {useNostrContext} from '../context/NostrContext';

export type UseReplyNotesOptions = {
  noteId?: string;
  authors?: string[];
  search?: string;
};

export const useReplyNotes = (options?: UseReplyNotesOptions):UseInfiniteQueryResult<InfiniteData<any, any>, Error>=> {
  const {ndk} = useNostrContext();

  return useInfiniteQuery({
    initialPageParam: 0,
    queryKey: ['replyNotes', options?.noteId, options?.authors, options?.search, ndk],
    getNextPageParam: (lastPage: any, allPages, lastPageParam) => {
      if (!lastPage?.length) return undefined;

      const pageParam = lastPage[lastPage.length - 1].created_at - 1;

      if (!pageParam || pageParam === lastPageParam) return undefined;
      return pageParam;
    },
    queryFn: async ({pageParam}) => {

      if(!options?.noteId) {
        console.log("no note id");
        return [];
      }

      const notes = await ndk.fetchEvents({
        kinds: [NDKKind.Text],
        authors: options?.authors,
        search: options?.search,
        until: pageParam || Math.round(Date.now() / 1000),
        limit: 20,
        '#e': options?.noteId ? [options.noteId] : undefined,
      });

      console.log("notes", notes);

      return [...notes].filter((note) => note.tags.every((tag) => tag[0] === 'e' && tag[1] === options?.noteId));
    },
    placeholderData: {pages: [], pageParams: []},
  });
};
