import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../context/NostrContext';

export const useSendMessageChannel = () => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['sendNoteChannel', ndk],
    mutationFn: async (data: {content: string; tags?: string[][]}) => {
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.ChannelMessage;
      event.content = data.content;
      event.tags = data.tags ?? [];

      event.sign();
      return event.publish();
    },
  });
};
