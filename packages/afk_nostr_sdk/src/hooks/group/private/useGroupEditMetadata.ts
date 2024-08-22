import {useMutation} from '@tanstack/react-query';
import {useNostrContext} from '../../../context/NostrContext';
import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {objectToTagArray} from './util';

type UpdateMetaData = {
  name?: string;
  about?: string;
  picture?: string;
};

// TODO
export const useGroupEditMetadata = () => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['editGroupMetadata', ndk],
    mutationFn: async (data: {pubkey: string; groupId: string; meta: UpdateMetaData}) => {
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.GroupAdminEditMetadata;
      event.tags = [['d', data.groupId], objectToTagArray(data.meta)[0]];

      return event.publish();
    },
  });
};
