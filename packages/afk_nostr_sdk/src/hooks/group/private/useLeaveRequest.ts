import {NDKEvent} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';

// TODO
export const useLeaveGroupRequest = () => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['leaveGroupRequest', ndk],
    mutationFn: async (data: {groupId: string; content?: string}) => {
      const event = new NDKEvent(ndk);
      event.kind = 9022; //  NDKKind.GroupAdminRequestLeave;
      event.content = data?.content || '';
      event.tags = [['h', data.groupId]];
      return event.publish();
    },
  });
};
