import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {useAuth} from '../../../store';
import {AdminGroupPermission} from './useAddPermissions';
import {checkGroupPermission} from './useGetPermission';

export const useRemoveMember = () => {
  const {ndk} = useNostrContext();
  const {publicKey: pubkey} = useAuth();

  return useMutation({
    mutationKey: ['removeMemberGroup'],
    mutationFn: async (data: {pubkey: string; groupId: string}) => {
      const event = new NDKEvent(ndk);
      const hasPermission = await checkGroupPermission({
        groupId: data.groupId,
        ndk,
        pubkey,
        action: AdminGroupPermission.RemoveUser,
      });

      if (!hasPermission) {
        throw new Error('You do not have permission to remove member');
      }
      event.kind = NDKKind.GroupAdminRemoveUser;
      event.tags = [
        ['h', data.groupId],
        ['d', data.groupId],
        ['p', data.pubkey],
      ];

      event.publish();
      return event;
    },
  });
};
