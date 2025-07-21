import { NDKKind } from '@nostr-dev-kit/ndk';
import { useQuery } from '@tanstack/react-query';

import { useNostrContext } from '../context/NostrContext';
import { checkIsConnected } from './connect';
import { nip19 } from 'nostr-tools';
export type UseNoteOptions = {
  noteId: string;
  kinds?: NDKKind[];
};

export const useNote = (options: UseNoteOptions) => {
  const { ndk } = useNostrContext();

  return useQuery({
    queryKey: ['note', options.noteId, ndk, options.kinds],
    queryFn: async () => {

      await checkIsConnected(ndk);

      if(!options.noteId) {
        return null;
      }

      let noteId: string;
      if (options.noteId?.includes("nevent")) {
        const decoded = nip19.decode(options.noteId).data;
        // If decoded is an object with an 'id' property, use it; otherwise fallback to string
        if (typeof decoded === "object" && decoded !== null && "id" in decoded) {
          noteId = (decoded as { id: string }).id;
        } else if (typeof decoded === "string") {
          noteId = decoded;
        } else {
          throw new Error("Invalid nevent format");
        }
      } else {
        noteId = options.noteId;
      }

      const note = await ndk.fetchEvent({
        kinds: options.kinds ?? [NDKKind.Text, NDKKind.Article, NDKKind.ChannelMetadata, NDKKind.ChannelCreation, NDKKind.Metadata, NDKKind.ShortVideo, NDKKind.Video, NDKKind.VerticalVideo],
        ids: [noteId],
      });

      return note;
    },
  });
};
