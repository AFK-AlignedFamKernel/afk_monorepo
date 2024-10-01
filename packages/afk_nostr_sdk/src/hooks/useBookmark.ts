import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {useNostrContext} from '../context/NostrContext';

interface BookmarkParams {
  event: NDKEvent;
  category?: string;
}

interface RemoveBookmarkParams {
  eventId: string;
  category?: string;
}

export const useBookmark = (userPublicKey: string) => {
  const {ndk} = useNostrContext();
  const queryClient = useQueryClient();

  const fetchBookmarks = async () => {
    if (!ndk.signer) {
      throw new Error('No signer available');
    }
    const filter = {kinds: [NDKKind.BookmarkList, NDKKind.BookmarkSet], authors: [userPublicKey]};
    const events = await ndk.fetchEvents(filter);

    const eventsArray = Array.from(events);

    // Fetch full content for each bookmarked event
    const fullEvents = await Promise.all(
      eventsArray.map(async (event) => {
        const fullEvent = await ndk.fetchEvent(event.id);
        return fullEvent;
      }),
    );

    return fullEvents;
  };

  const bookmarks = useQuery({
    queryKey: ['bookmarks', userPublicKey],
    queryFn: fetchBookmarks,
    enabled: !!userPublicKey,
  });

  const extractNoteIds = (bookmarks: NDKEvent[]) => {
    const noteIds: Set<string> = new Set();

    bookmarks.forEach((bookmark) => {
      bookmark.tags.forEach((tag) => {
        if (tag[0] === 'e') {
          noteIds.add(tag[1]); // Collect note IDs
        }
      });
    });

    return Array.from(noteIds);
  };

  const fetchNotesByIds = async (noteIds: string[]) => {
    if (!ndk.signer) {
      throw new Error('No signer available');
    }

    const filter = {ids: noteIds};
    const events = await ndk.fetchEvents(filter);
    return Array.from(events);
  };

  const fetchBookmarksWithNotes = async () => {
    const bookmarks = await fetchBookmarks();
    const noteIds = extractNoteIds(bookmarks);
    const notes = await fetchNotesByIds(noteIds);

    // Create a mapping of note ID to note event
    const noteMap = new Map(notes.map((note) => [note.id, note]));

    // Combine bookmarks with note data
    const bookmarksWithNotes = bookmarks.map((bookmark) => {
      const bookmarkedNotes = bookmark.tags
        .filter((tag) => tag[0] === 'e')
        .map((tag) => noteMap.get(tag[1]));

      return {
        bookmarkEvent: bookmark,
        notes: bookmarkedNotes,
      };
    });

    return bookmarksWithNotes;
  };

  const bookmarksWithNotesQuery = useQuery({
    queryKey: ['bookmarksWithNotes', userPublicKey],
    queryFn: fetchBookmarksWithNotes,
    enabled: !!userPublicKey,
  });

  const bookmarkNote = useMutation({
    mutationKey: ['bookmark', ndk],
    mutationFn: async ({event, category}: BookmarkParams) => {
      if (!event) {
        throw new Error('No event provided for bookmark');
      }

      let bookmarks = await fetchBookmarks();
      let bookmarkEvent = bookmarks.find(
        (e) => e.kind === (category ? NDKKind.BookmarkSet : NDKKind.BookmarkList),
      );

      console.log('bookmarkEvent', bookmarkEvent);

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
        const existingTagIndex = bookmarkEvent.tags.findIndex(
          (tag) => tag[0] === 'd' && tag[1] === category,
        );
        if (existingTagIndex === -1) {
          bookmarkEvent.tags.push(['d', category]);
        }
      }

      const existingEventIndex = bookmarkEvent.tags.findIndex(
        (tag) => tag[0] === 'e' && tag[1] === event.id,
      );
      if (existingEventIndex === -1) {
        bookmarkEvent.tags.push(['e', event.id, event.relay?.url || '']);
        bookmarkEvent.tags.push(['p', event.pubkey]);
      }

      await bookmarkEvent.sign();
      return bookmarkEvent.publish();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['bookmarks', userPublicKey]});
    },
    onError: (error) => {
      console.error('Failed to bookmark note:', error);
    },
  });

  const removeBookmark = useMutation({
    mutationKey: ['bookmarks', ndk],
    mutationFn: async ({eventId, category}: RemoveBookmarkParams) => {
      let bookmarks = await fetchBookmarks();
      let bookmarkEvent = bookmarks.find(
        (e) => e.kind === (category ? NDKKind.BookmarkSet : NDKKind.BookmarkList),
      );

      if (!bookmarkEvent) {
        throw new Error('Bookmark not found');
      }

      // Resetting the id and created_at to avoid conflicts
      bookmarkEvent.id = undefined as any;
      bookmarkEvent.created_at = undefined;

      if (category) {
        bookmarkEvent.tags = bookmarkEvent.tags.filter(
          (tag) => !(tag[0] === 'd' && tag[1] === category),
        );
      }

      // Remove the specific event
      bookmarkEvent.tags = bookmarkEvent.tags.filter(
        (tag) => !(tag[0] === 'e' && tag[1] === eventId),
      );

      await bookmarkEvent.sign();
      await bookmarkEvent.publish();
      // if (bookmarkEvent.tags.length > 0) {
      //   await bookmarkEvent.sign();
      //   await bookmarkEvent.publish();
      // }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['bookmarks', userPublicKey]});
    },
    onError: (error) => {
      console.error('Failed to remove bookmark:', error);
    },
  });

  return {
    bookmarkNote: bookmarkNote.mutateAsync,
    removeBookmark: removeBookmark.mutateAsync,
    bookmarks: bookmarks.data,
    isFetchingBookmarks: bookmarks.isFetching,
    bookmarksWithNotes: bookmarksWithNotesQuery,
  };
};
