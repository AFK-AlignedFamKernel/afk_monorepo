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

  const fetchBookmarks = async () => {
    if (!ndk.signer) {
      throw new Error('No signer available');
    }
    const filter = { kinds: [NDKKind.BookmarkList, NDKKind.BookmarkSet], authors: [userPublicKey] };
    const events = await ndk.fetchEvents(filter);
    return Array.from(events);
  };

  const getBookmarks = useQuery({
    queryKey: ['bookmarks', userPublicKey],
    queryFn: fetchBookmarks,
    enabled: !!userPublicKey,
  });

  const bookmarkNote = useMutation({
    mutationKey: ['bookmark', ndk],
    mutationFn: async ({ event, category }: BookmarkParams) => {
      let bookmarks = await fetchBookmarks();
      let bookmarkEvent = bookmarks.find((e) => e.kind === (category ? NDKKind.BookmarkSet : NDKKind.BookmarkList));

      if (!bookmarkEvent) {
        bookmarkEvent = new NDKEvent(ndk);
        bookmarkEvent.kind = category ? NDKKind.BookmarkSet : NDKKind.BookmarkList;
        bookmarkEvent.content = '';
        bookmarkEvent.tags = [];
      }

      // Resetting the id and created_at to avoid conflicts
      bookmarkEvent.id = undefined as any;
      bookmarkEvent.created_at = undefined;

      // If there's a specific category, add it
      if (category) {
        const existingTagIndex = bookmarkEvent.tags.findIndex(tag => tag[0] === 'd' && tag[1] === category);
        if (existingTagIndex === -1) {
          bookmarkEvent.tags.push(['d', category]);
        }
      }

      const existingEventIndex = bookmarkEvent.tags.findIndex(tag => tag[0] === 'e' && tag[1] === event.id);
      if (existingEventIndex === -1) {
        bookmarkEvent.tags.push(['e', event.id, event.relay?.url || '']);
        bookmarkEvent.tags.push(['p', event.pubkey]);
      }

      await bookmarkEvent.sign();
      return bookmarkEvent.publish();

    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks', userPublicKey] });
    },
    onError: (error) => {
      console.error('Failed to bookmark note:', error);
    },
  });

  const removeBookmark = useMutation({
    mutationKey: ['bookmarks', ndk],
    mutationFn: async ({ eventId, category }: RemoveBookmarkParams) => {
      let bookmarks = await fetchBookmarks();
      let bookmarkEvent = bookmarks.find((e) => e.kind === (category ? NDKKind.BookmarkSet : NDKKind.BookmarkList));

      if (!bookmarkEvent) {
        throw new Error('Bookmark not found');
      }

      // Resetting the id and created_at to avoid conflicts
      bookmarkEvent.id = undefined as any;
      bookmarkEvent.created_at = undefined;

      if (category) {
        bookmarkEvent.tags = bookmarkEvent.tags.filter(tag => !(tag[0] === 'd' && tag[1] === category));
      }

      // Remove the specific event
      bookmarkEvent.tags = bookmarkEvent.tags.filter(tag => !(tag[0] === 'e' && tag[1] === eventId));

      if (bookmarkEvent.tags.length > 0) {
        await bookmarkEvent.sign();
        await bookmarkEvent.publish();
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
