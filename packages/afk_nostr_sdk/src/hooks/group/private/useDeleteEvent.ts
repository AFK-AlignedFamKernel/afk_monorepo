import {NDKEvent} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {useAuth} from '../../../store';
import {AdminGroupPermission} from './useAddPermissions';
import {checkGroupPermission} from './useGetPermission';

// TODO
export const useDeleteEvent = () => {
  const {ndk} = useNostrContext();
  const {publicKey: pubkey} = useAuth();
  return useMutation({
    mutationKey: ['deleteEventGroup'],
    mutationFn: async (data: {
      id: string;
      groupId: string;
      permissionData?: AdminGroupPermission[];
    }) => {
      const event = new NDKEvent(ndk);
      const hasPermission = await checkGroupPermission({
        groupId: data.groupId,
        ndk,
        pubkey,
        action: AdminGroupPermission.DeleteEvent,
      });

      if (!hasPermission) {
        throw new Error('You do not have permission to delete this event');
      }
      event.kind = 9005; //NDKKind.GroupAdminDeleteEvent;
      event.tags = [
        ['d', data.groupId],
        ['e', data.id],
      ];
      return event.publish();
    },
  });
};
