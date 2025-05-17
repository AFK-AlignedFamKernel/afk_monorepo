import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import { useMutation, UseMutationResult } from '@tanstack/react-query';

import { useNostrContext } from '../../context/NostrContext';

export const useSendVideo = (): UseMutationResult<any> => {
  const { ndk } = useNostrContext();

  return useMutation({
    mutationKey: ['sendVideo', ndk],
    mutationFn: async (data: {
      content: string;
      kind?: NDKKind.VerticalVideo | NDKKind.HorizontalVideo;
      tags?: string[][];
    }) => {
      const event = new NDKEvent(ndk);
      event.kind = data?.kind ?? NDKKind.VerticalVideo;
      event.content = data.content;
      event.tags = data.tags ?? [];

      return event.publish();
    },
  });
};
