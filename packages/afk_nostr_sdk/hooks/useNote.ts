import {NDKKind} from '@nostr-dev-kit/ndk';
import {useQuery} from '@tanstack/react-query';

<<<<<<<< HEAD:packages/afk_nostr_sdk/src/hooks/useNote.ts
========
// import {useNostrContext} from '../../context/NostrContext';
>>>>>>>> main:packages/afk_nostr_sdk/hooks/useNote.ts
import {useNostrContext} from '../context/NostrContext';

import {useAuth} from '../store/auth';
export type UseNoteOptions = {
  noteId: string;
};

export const useNote = (options: UseNoteOptions) => {
  const {ndk} = useNostrContext();

  return useQuery({
    queryKey: ['note', options.noteId, ndk],
    queryFn: async () => {
      const note = await ndk.fetchEvent({
        kinds: [NDKKind.Text],
        ids: [options.noteId],
      });

      return note ?? undefined;
    },
  });
};
