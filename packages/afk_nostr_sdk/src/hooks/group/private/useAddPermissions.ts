import {useMutation} from '@tanstack/react-query';
import {useNostrContext} from '../../../context/NostrContext';
import {useAuth} from '../../../store';
import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';

export type UseAddPermissionsOptions = {
  authors?: string[];
  search?: string;
};

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

// TODO
export const useAddPermissions = (options?: UseAddPermissionsOptions) => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['addPermissions', ndk],
    mutationFn: async (data: {
      pubkey: string;
      permissionName: AdminGroupPermission[];
      groupId: string;
    }) => {
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.GroupAdminAddPermission;
      event.tags = [
        ['d', data.groupId],
        ['p', data.pubkey, ...data.permissionName],
      ];
      return event.publish();
    },
  });
};
