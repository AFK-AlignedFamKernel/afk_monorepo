import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation, useQuery} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {AdminGroupPermission} from './useAddPermissions';
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

  return useMutation({
    mutationKey: ['editGroupMetadata', ndk],
    mutationFn: async (data: {
      groupId: string;
      meta: UpdateMetaData;
      permissionData: AdminGroupPermission[];
    }) => {
      if (data.permissionData && !data.permissionData.includes(AdminGroupPermission.EditMetadata)) {
        throw new Error('You do not have permission to edit metadata');
      } else {
        const editedTag = objectToTagArray(data.meta);

        const event = new NDKEvent(ndk);
        event.content = data.meta.name;
        event.kind = NDKKind.GroupAdminEditMetadata;
        event.tags = [['h', data.groupId], ['d', data.groupId], ...editedTag];

        return event.publish();
      }
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
