import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {AdminGroupPermission} from './useAddPermissions';

export const useAddMember = () => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['addMemberGroup', ndk],
    mutationFn: async (data: {
      pubkey: string;
      groupId: string;
      permissionData?: AdminGroupPermission[];
    }) => {
      if (data?.permissionData && !data.permissionData.includes(AdminGroupPermission.AddMember)) {
        throw new Error('You do not have permission to add a member to this group');
      } else {
        const event = new NDKEvent(ndk);
        event.kind = NDKKind.GroupAdminAddUser;
        event.tags = [
          ['d', data.groupId],
          ['p', data.pubkey],
        ];
        return event.publish();
      }
    },
  });
};
