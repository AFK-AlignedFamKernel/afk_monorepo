import {NDKEvent} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {useAuth} from '../../../store';
import {AdminGroupPermission} from './useAddPermissions';
import {checkGroupPermission} from './useGetPermission';

// TODO
export const useRemovePermissions = () => {
  const {ndk} = useNostrContext();
  const {publicKey: pubkey} = useAuth();

  return useMutation({
    mutationKey: ['removePermissions'],
    mutationFn: async (data: {
      pubkey: string;
      permissionName: AdminGroupPermission[];
      groupId: string;
    }) => {
      const event = new NDKEvent(ndk);
      const hasPermission = await checkGroupPermission({
        groupId: data.groupId,
        ndk,
        pubkey,
        action: AdminGroupPermission.DeleteGroup,
      });

      if (!hasPermission) {
        throw new Error('You do not have access to remove permission');
      }
      event.kind = 9004; // NDKKind.GroupAdminRemovePermission;

      event.tags = [
        ['d', data.groupId],
        ['p', data.pubkey, ...data.permissionName],
      ];
      return event.publish();
    },
  });
};
