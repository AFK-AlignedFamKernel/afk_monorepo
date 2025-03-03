import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation, useQueryClient} from '@tanstack/react-query';

import {useNostrContext} from '../context/NostrContext';

export type UseQuoteOptions = {
  event?: NDKEvent;
  content?: string;
  tags?: string[][];
};

export const useQuote  = (options?: UseQuoteOptions) => {
  const {ndk} = useNostrContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['sendQuote', ndk],
    mutationFn: async (data: {content: string; tags?: string[][], event?: NDKEvent}) => {
      if (!data?.event) {
        throw new Error('No event provided for repost');
      }

      const quoteEvent   = new NDKEvent(ndk);
      quoteEvent.kind = NDKKind.Text;
      // repostEvent.content = JSON.stringify(options.content);
      quoteEvent.content = options.content;
      quoteEvent.tags = [
        ['e', options.event.id, options.event.relay?.url || ''],
        ['p', options.event.pubkey],
      ];
      await quoteEvent.publish();
      return quoteEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['notes']});
      queryClient.invalidateQueries({queryKey: ['reactions']});
    },
  });
};
