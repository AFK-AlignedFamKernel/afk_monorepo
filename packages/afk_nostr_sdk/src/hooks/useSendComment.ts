import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../context/NostrContext';

export const useSendComment = () => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['sendComment', ndk],
    mutationFn: async (data: {content: string; tags?: string[][]}) => {
      const event = new NDKEvent(ndk);
      event.kind = 1111 as NDKKind;
      event.content = data.content;
      event.tags = data.tags ?? [];

      return event.publish();
    },
  });
};
