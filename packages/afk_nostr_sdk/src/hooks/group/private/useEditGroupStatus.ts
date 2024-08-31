import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {AdminGroupPermission} from './useAddPermissions';
import {objectToTagArray} from './util';

type GroupStatus = {
  groupVisibility: 'public' | 'private';
  chatAccessType: 'open' | 'close';
};

// TODO
export const useGroupEditStatus = () => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['editGroupStatus', ndk],
    mutationFn: async (data: {
      groupId: string;
      status: GroupStatus;
      permissionData: AdminGroupPermission[];
    }) => {
      if (
        data.permissionData &&
        !data.permissionData.includes(AdminGroupPermission.EditGroupStatus)
      ) {
        throw new Error('You do not have permission to edit status');
      } else {
        const event = new NDKEvent(ndk);
        event.kind = NDKKind.GroupAdminEditStatus;
        event.tags = [['d', data.groupId], objectToTagArray(data.status)[0]];
        return event.publish();
      }
    },
  });
};
