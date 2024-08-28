import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';

export const useJoinGroupRequest = () => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['joinGroupRequest', ndk],
    mutationFn: async (data: {groupId: string; content?: string}) => {
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.GroupAdminRequestJoin;
      event.content = data?.content || '';
      event.tags = [['h', data.groupId]];
      return event.publish();
    },
  });
};
