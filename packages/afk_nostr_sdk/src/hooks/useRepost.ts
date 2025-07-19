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

      console.log("options?.event", options?.event);
      const repostEvent = new NDKEvent(ndk);
      repostEvent.kind = NDKKind.Repost;

      try {
      const rawEvent = options?.event?.rawEvent();
      console.log("rawEvent", rawEvent);
        repostEvent.content = JSON.stringify(rawEvent);
      } catch (error) {
        repostEvent.content = JSON.stringify(options?.event);
      }

   ;
      repostEvent.tags = [
        ['e', options?.event?.id, options?.event?.relay?.url || ''],
        ['p', options?.event?.pubkey],
      ];
      await repostEvent.sign();
      await repostEvent.publish();
      return repostEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['notes']});
      queryClient.invalidateQueries({queryKey: ['reactions']});
    },
  });
};


export const useRepostRaw = (options?: UseRepostOptions) => {
  const {ndk} = useNostrContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['sendRepost', ndk],
    mutationFn: async () => {
      if (!options?.event) {
        throw new Error('No event provided for repost');
      }

      console.log("options?.event", options?.event);
      const repostEvent = new NDKEvent(ndk);
      repostEvent.kind = NDKKind.Repost;
      repostEvent.content = JSON.stringify(options?.event);
      repostEvent.tags = [
        ['e', options?.event?.id, options?.event?.relay?.url || ''],
        ['p', options?.event?.pubkey],
      ];
      await repostEvent.sign();
      await repostEvent.publish();
      return repostEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['notes']});
      queryClient.invalidateQueries({queryKey: ['reactions']});
    },
  });
};