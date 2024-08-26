import { NDKEvent } from '@nostr-dev-kit/ndk';
import { useMutation } from '@tanstack/react-query';

import { useNostrContext } from '../../context/NostrContext';

export const useSendPrivateMessage = () => {
  const { ndk } = useNostrContext();

  return useMutation({
    mutationKey: ['sendPrivateMessage', ndk],
    mutationFn: async (data: { content: string; tags?: string[][] }) => {
      const event = new NDKEvent(ndk);
      event.kind = 14;
      event.created_at = new Date().getTime()
      event.content = data.content;

      //   // ["p", "<receiver-1-pubkey>", "<relay-url>"],
      // ["p", "<receiver-2-pubkey>", "<relay-url>"],
      // ["e", "<kind-14-id>", "<relay-url>", "reply"] // if this is a reply
      // ["subject", "<conversation-title>"],
      event.tags = data.tags ?? [];

      return event;
    },
  });
};
