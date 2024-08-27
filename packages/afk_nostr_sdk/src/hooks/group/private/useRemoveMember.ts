import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {useAuth} from '../../../store';
import {AdminGroupPermission} from './useAddPermissions';
import {checkGroupPermission} from './useGetPermission';

// TODO
export const useRemoveMember = () => {
  const {ndk} = useNostrContext();
  const {publicKey: pubkey} = useAuth();

  return useMutation({
    mutationKey: ['removeMemberGroup', ndk],
    mutationFn: async (data: {pubkey: string; groupId: string}) => {
      const hasPermission = checkGroupPermission({
        groupId: data.groupId,
        ndk,
        pubkey,
        action: AdminGroupPermission.RemoveUser,
      });

      if (!hasPermission) {
        throw new Error('You do not have permission to remove member');
      }
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.GroupAdminRemoveUser;
      event.tags = [
        ['d', data.groupId],
        ['p', data.pubkey],
      ];
      return event.publish();
    },
  });
};
