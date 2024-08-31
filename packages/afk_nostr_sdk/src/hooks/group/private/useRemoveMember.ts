import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {AdminGroupPermission} from './useAddPermissions';

export const useRemoveMember = () => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['removeMemberGroup'],
    mutationFn: async (data: {
      pubkey: string;
      groupId: string;
      permissionData: AdminGroupPermission[];
    }) => {
      if (!data.permissionData && !data.permissionData.includes(AdminGroupPermission.RemoveUser)) {
        throw new Error('You do not have permission to remove member');
      } else {
        const event = new NDKEvent(ndk);
        event.kind = NDKKind.GroupAdminRemoveUser;
        event.tags = [
          ['h', data.groupId],
          ['d', data.groupId],
          ['p', data.pubkey],
        ];

        event.publish();
        return event;
      }
    },
  });
};
