import {NDKEvent} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {useAuth} from '../../../store';
import {AdminGroupPermission} from './useAddPermissions';

// TODO
export const useRemovePermissions = () => {
  const {ndk} = useNostrContext();
  const {publicKey: pubkey} = useAuth();

  return useMutation({
    mutationKey: ['removePermissions', ndk],
    mutationFn: async (data: {
      pubkey: string;
      permissionData: AdminGroupPermission[];
      permissionName: AdminGroupPermission[];
      groupId: string;
    }) => {
      if (
        data.permissionData &&
        !data.permissionData.includes(AdminGroupPermission.RemovePermission)
      ) {
        throw new Error('You do not have access to remove permission');
      } else {
        const event = new NDKEvent(ndk);
        event.kind = 9004; // NDKKind.GroupAdminRemovePermission;

        event.tags = [
          ['d', data.groupId],
          ['p', data.pubkey, ...data.permissionName],
        ];
        return event.publish();
      }
    },
  });
};
