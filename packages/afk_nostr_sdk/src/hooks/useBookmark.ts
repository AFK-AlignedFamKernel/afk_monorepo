import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrContext } from '../context/NostrContext';

export type UseBookmarkOptions = {
  event?: NDKEvent;
  category?: string;  // Optional, to categorize the bookmark
};

export const useBookmark = ({ event, category }: UseBookmarkOptions) => {
  const { ndk } = useNostrContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["bookmarkEvent", ndk],
    mutationFn: async () => {
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
  });
};
