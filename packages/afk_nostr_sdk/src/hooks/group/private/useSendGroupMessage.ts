import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';

// TODO
export const useSendGroupMessages = () => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['sendGroupMessage', ndk],
    mutationFn: async (data: {
      pubkey: string;
      content: string;
      groupId: string;
      tag?: string[];
      previousEventIds?: string[];
    }) => {
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.GroupNote;
      event.content = data.content;
      event.tags = [
        ['h', data.groupId],
        ['previous', ...(data.previousEventIds ?? [])],
      ];
      return event.publish();
    },
  });
};
