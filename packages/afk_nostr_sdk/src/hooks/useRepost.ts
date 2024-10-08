import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation, useQueryClient} from '@tanstack/react-query';
import {useNostrContext} from '../context/NostrContext';

export type UseRepostOptions = {
  event?: NDKEvent;
};

export const useRepost = (options?: UseRepostOptions) => {
  const {ndk} = useNostrContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['sendRepost', ndk],
    mutationFn: async () => {
      if (!options?.event) {
        throw new Error('No event provided for repost');
      }

      const repostEvent = new NDKEvent(ndk);
      repostEvent.kind = NDKKind.Repost;
      repostEvent.content = JSON.stringify(options.event.rawEvent());
      repostEvent.tags = [
        ['e', options.event.id, options.event.relay?.url || ''],
        ['p', options.event.pubkey],
      ];
      await repostEvent.publish();
      return repostEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['notes']});
      queryClient.invalidateQueries({queryKey: ['reactions']});
    },
  });
};
