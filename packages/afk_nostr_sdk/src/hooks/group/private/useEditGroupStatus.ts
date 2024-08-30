import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {useAuth} from '../../../store';
import {AdminGroupPermission} from './useAddPermissions';
import {checkGroupPermission} from './useGetPermission';
import {objectToTagArray} from './util';

type GroupStatus = {
  groupVisibility: 'public' | 'private';
  chatAccessType: 'open' | 'close';
};

// TODO
export const useGroupEditStatus = () => {
  const {ndk} = useNostrContext();
  const {publicKey: pubkey} = useAuth();

  return useMutation({
    mutationKey: ['editGroupStatus', ndk],
    mutationFn: async (data: {groupId: string; status: GroupStatus}) => {
      const hasPermission = checkGroupPermission({
        groupId: data.groupId,
        ndk,
        pubkey,
        action: AdminGroupPermission.EditGroupStatus,
      });

      if (!hasPermission) {
        throw new Error('You do not have permission to edit status');
      }
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.GroupAdminEditStatus;
      event.tags = [['d', data.groupId], objectToTagArray(data.status)[0]];
      return event.publish();
    },
  });
};
