import { NDKKind } from '@nostr-dev-kit/ndk';
import { useQuery } from '@tanstack/react-query';

import { useNostrContext } from '../context/NostrContext';
export type UseNoteOptions = {
  noteId: string;
  kinds?: NDKKind[];
};

export const useNote = (options: UseNoteOptions) => {
  const { ndk } = useNostrContext();

  return useQuery({
    queryKey: ['note', options.noteId, ndk, options.kinds],
    queryFn: async () => {
      const note = await ndk.fetchEvent({
        kinds: options.kinds ?? [NDKKind.Text, NDKKind.Article, NDKKind.ChannelMetadata, NDKKind.ChannelCreation, NDKKind.Metadata, NDKKind.ShortVideo],
        ids: [options.noteId],
      });

      return note ?? undefined;
    },
  });
};
