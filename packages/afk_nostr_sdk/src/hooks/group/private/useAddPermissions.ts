import {NDKEvent} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';

export enum AdminGroupPermission {
  AddMember = 'add-user',
  EditMetadata = 'edit-metadata',
  DeleteEvent = 'delete-event',
  RemoveUser = 'remove-user',
  AddPermission = 'add-permission',
  RemovePermission = 'remove-permission',
  EditGroupStatus = 'edit-group-status',
  DeleteGroup = 'delete-group',
}
type IAdminGroupPermission = `${AdminGroupPermission}`;

export const useAddPermissions = () => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['addPermissions', ndk],
    mutationFn: async (data: {
      pubkey: string;
      permissionName: IAdminGroupPermission[];
      groupId: string;
    }) => {
      const event = new NDKEvent(ndk);
      event.kind = 9003; // NDKKind.GroupAdminAddPermission;
      event.tags = [
        // ['h', data.groupId],
        ['h', data.groupId],
        ['p', data.pubkey, ...data.permissionName],
      ];
      return event.publish();
    },
  });
};
