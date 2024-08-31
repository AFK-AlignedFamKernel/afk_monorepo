import {NDKEvent} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {AdminGroupPermission} from './useAddPermissions';

// TODO
export const useDeleteEvent = () => {
  const {ndk} = useNostrContext();
  return useMutation({
    mutationKey: ['deleteEventGroup', ndk],
    mutationFn: async (data: {
      id: string;
      groupId: string;
      permissionData?: AdminGroupPermission[];
    }) => {
      if (data.permissionData && !data.permissionData.includes(AdminGroupPermission.DeleteEvent)) {
        throw new Error('You do not have permission to delete this event');
      } else {
        const event = new NDKEvent(ndk);
        event.kind = 9005; //NDKKind.GroupAdminDeleteEvent;
        event.tags = [
          ['d', data.groupId],
          ['e', data.id],
        ];
        return event.publish();
      }
    },
  });
};
