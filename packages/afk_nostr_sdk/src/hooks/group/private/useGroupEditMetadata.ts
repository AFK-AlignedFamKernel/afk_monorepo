import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation, useQuery} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {useAuth} from '../../../store';
import {AdminGroupPermission} from './useAddPermissions';
import {checkGroupPermission} from './useGetPermission';
import {objectToTagArray} from './util';

type UpdateMetaData = {
  name?: string;
  about?: string;
  access?: string;
  picture?: string;
};

interface UseGetGroupMetaData {
  pubKey: string;
  search?: string;
  limit?: number;
  groupId: string;
}

export const useGroupEditMetadata = () => {
  const {ndk} = useNostrContext();
  const {publicKey: pubkey} = useAuth();

  return useMutation({
    mutationKey: ['editGroupMetadata', ndk],
    mutationFn: async (data: {
      groupId: string;
      meta: UpdateMetaData;
      permissionData?: AdminGroupPermission[];
    }) => {
      const event = new NDKEvent(ndk);
      const hasPermission = checkGroupPermission({
        groupId: data.groupId,
        ndk,
        pubkey,
        action: AdminGroupPermission.EditMetadata,
      });

      if (!hasPermission) {
        throw new Error('You do not have permission to edit metadata');
      }
      const editedTag = objectToTagArray(data.meta);

      event.content = data?.meta?.name || '';
      event.kind = NDKKind.GroupAdminEditMetadata;
      event.tags = [['h', data.groupId], ['d', data.groupId], ...editedTag];

      return event.publish();
    },
  });
};

export const useGetGroupMetadata = (options: UseGetGroupMetaData) => {
  const {ndk} = useNostrContext();

  return useQuery({
    queryKey: ['getGroupMetaData', options.pubKey, options.groupId],
    queryFn: async () => {
      const events = await ndk.fetchEvent({
        kinds: [NDKKind.GroupAdminEditMetadata],
        authors: [options.pubKey],
        '#d': [options.groupId],
      });

      return events ?? null;
    },
  });
};
