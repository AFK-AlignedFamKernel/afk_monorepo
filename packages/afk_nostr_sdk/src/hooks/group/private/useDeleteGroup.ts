import {NDKEvent} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {AdminGroupPermission} from './useAddPermissions';

// TODO
export const useDeleteGroup = () => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['deleteGroup', ndk],
    mutationFn: async (data: {groupId: string; permissionData: AdminGroupPermission[]}) => {
      if (data.permissionData && !data.permissionData.includes(AdminGroupPermission.DeleteGroup)) {
        throw new Error('You do not have permission to delete group');
      } else {
        const event = new NDKEvent(ndk);
        event.kind = 9008; // NDKKind.GroupAdminDeleteGroup;
        event.tags = [['d', data.groupId]];
        return event.publish();
      }
    },
  });
};
