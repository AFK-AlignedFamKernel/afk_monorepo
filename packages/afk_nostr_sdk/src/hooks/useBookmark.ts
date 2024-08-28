import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNostrContext } from '../context/NostrContext';

interface BookmarkParams {
  event: NDKEvent;
  category?: string;
}

interface RemoveBookmarkParams {
  eventId: string;
  category?: string;
}

export const useBookmark = (userPublicKey: string) => {
  const { ndk } = useNostrContext();
  const queryClient = useQueryClient();

  const bookmarkNote = useMutation({
    mutationKey: ["bookmark", ndk],
    mutationFn: async ({ event, category }: BookmarkParams) => {
      if (!event) {
        throw new Error('No event provided for bookmark');
      }

      const bookmarkEvent = new NDKEvent(ndk);

      if (category) {
        bookmarkEvent.kind = NDKKind.BookmarkSet; 
        bookmarkEvent.tags = [
          ['d', category],  
          ['e', event.id, event.relay?.url || ''], 
          ['p', event.pubkey],  
        ];
      } else {
        bookmarkEvent.kind = 10003;  
        bookmarkEvent.tags = [
          ['e', event.id, event.relay?.url || ''],
          ['p', event.pubkey],
        ];
      }

      await bookmarkEvent.publish();
      return bookmarkEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
    onError: (error) => {
      console.error('Failed to bookmark note:', error);
    },
  });

  const getBookmarks = useQuery({
    queryKey: ['bookmarks', userPublicKey],
    queryFn: async () => {
      if (!ndk.signer) {
        throw new Error('No signer available');
      }
      const filter = { kinds: [10003, 30003], authors: [userPublicKey] };
      const events = await ndk.fetchEvents(filter);
      return Array.from(events);
    },
  });

  const removeBookmark = useMutation({
    mutationKey: ["bookmark", ndk],
    mutationFn: async ({ eventId, category }: RemoveBookmarkParams) => {
      const existingBookmarks = getBookmarks.data;

      if (!existingBookmarks) {
        throw new Error('No existing bookmarks found');
      }

      const bookmarkEvent = existingBookmarks.find((event) => {
        const isMatchingCategory = category
          ? event.tags.some(tag => tag[0] === 'd' && tag[1] === category)
          : true;

        return isMatchingCategory && event.tags.some(tag => tag[0] === 'e' && tag[1] === eventId);
      });

      if (bookmarkEvent) {
        bookmarkEvent.tags = bookmarkEvent.tags.filter(tag => !(tag[0] === 'e' && tag[1] === eventId));
        if (bookmarkEvent.tags.length > 0) {
          await bookmarkEvent.publish(); 
        }
      } else {
        throw new Error('Bookmark not found');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', userPublicKey] });
    },
    onError: (error) => {
      console.error('Failed to remove bookmark:', error);
    },
  });

  return {
    bookmarkNote: bookmarkNote.mutateAsync,
    removeBookmark: removeBookmark.mutateAsync,
    getBookmarks: getBookmarks.data,
    isFetchingBookmarks: getBookmarks.isFetching,
  };
};
