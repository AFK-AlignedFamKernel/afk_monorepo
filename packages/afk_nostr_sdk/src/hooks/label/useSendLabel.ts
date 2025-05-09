import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation, UseMutationResult} from '@tanstack/react-query';

import {useNostrContext} from '../../context/NostrContext';

/**
 * Send an article to Nostr 
 * https://github.com/nostr-protocol/nips/blob/master/32.md
 * @returns 
 */
export const useSendLabel = ():UseMutationResult<any, Error, any, any> => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['sendLabel', ndk],
    mutationFn: async (data: {content: string; tags?: string[][]}) => {
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.Label;
      event.content = data.content;
      event.tags = data.tags ?? [];

      return event.publish();
    },
  });
};
