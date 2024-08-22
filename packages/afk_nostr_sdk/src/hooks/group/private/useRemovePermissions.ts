import {useMutation} from '@tanstack/react-query';
import {useNostrContext} from '../../../context/NostrContext';
import {useAuth} from '../../../store';
import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {AdminGroupPermission} from './useAddPermissions';

export type UseRemovePermissionsOptions = {
  authors?: string[];
  search?: string;
};

// TODO
export const useRemovePermissions = (options?: UseRemovePermissionsOptions) => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['removePermissions', ndk],
    mutationFn: async (data: {
      pubkey: string;
      permissionName: AdminGroupPermission[];
      groupId: string;
    }) => {
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.GroupAdminRemovePermission;
      event.tags = [
        ['d', data.groupId],
        ['p', data.pubkey, ...data.permissionName],
      ];
      return event.publish();
    },
  });
};
