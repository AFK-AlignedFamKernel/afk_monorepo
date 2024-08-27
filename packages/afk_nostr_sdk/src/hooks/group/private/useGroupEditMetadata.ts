import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {useAuth} from '../../../store';
import {AdminGroupPermission} from './useAddPermissions';
import {checkGroupPermission} from './useGetPermission';
import {objectToTagArray} from './util';

type UpdateMetaData = {
  name?: string;
  about?: string;
  picture?: string;
};

// TODO
export const useGroupEditMetadata = () => {
  const {ndk} = useNostrContext();
  const {publicKey: pubkey} = useAuth();

  return useMutation({
    mutationKey: ['editGroupMetadata', ndk],
    mutationFn: async (data: {groupId: string; meta: UpdateMetaData}) => {
      const hasPermission = checkGroupPermission({
        groupId: data.groupId,
        ndk,
        pubkey,
        action: AdminGroupPermission.EditMetadata,
      });

      if (!hasPermission) {
        throw new Error('You do not have permission to edit metadata');
      }
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.GroupAdminEditMetadata;
      event.tags = [['d', data.groupId], objectToTagArray(data.meta)[0]];

      return event.publish();
    },
  });
};
