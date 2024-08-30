import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {useAuth} from '../../../store';
import {AdminGroupPermission} from './useAddPermissions';
import {checkGroupPermission} from './useGetPermission';

export const useAddMember = () => {
  const {ndk} = useNostrContext();
  const {publicKey} = useAuth();

  return useMutation({
    mutationKey: ['addMemberGroup', ndk],
    mutationFn: async (data: {pubkey: string; groupId: string}) => {
      const hasPermission = await checkGroupPermission({
        groupId: data.groupId,
        ndk,
        pubkey: publicKey,
        action: AdminGroupPermission.AddMember,
      });

      if (!hasPermission) {
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
