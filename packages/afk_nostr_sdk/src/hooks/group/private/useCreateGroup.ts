import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';

// TODO
export const useCreateGroup = () => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['createGroup', ndk],
    mutationFn: async (data?: {groupType: 'private' | 'public'; groupName: string}) => {
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.GroupAdminCreateGroup;
      event.content = data.groupName;
      event.tags = [[data.groupType || 'private']];
      return event.publish();
    },
  });
};
