import {useMutation} from '@tanstack/react-query';
import {useNostrContext} from '../../../context/NostrContext';
import {useAuth} from '../../../store';
import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';

export type UseSendGroupMessages = {
  authors?: string[];
  search?: string;
};

// TODO
export const useSendGroupMessages = (options?: UseSendGroupMessages) => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['sendGroupMessage', ndk],
    mutationFn: async (data: {
      pubkey: string;
      content: string;
      groupId: string;
      tag?: string[];
    }) => {
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.GroupNote;
      event.content = data.content;

      event.tags = [['h', data.groupId], data.tag];
      return event.publish();
    },
  });
};
