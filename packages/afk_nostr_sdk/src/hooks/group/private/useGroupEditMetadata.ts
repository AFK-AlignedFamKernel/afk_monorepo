import {useMutation} from '@tanstack/react-query';
import {useNostrContext} from '../../../context/NostrContext';
import {useAuth} from '../../../store';
import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {objectToTagArray} from './util';

export type UseAddMemberOptions = {
  authors?: string[];
  search?: string;
};

type UpdateMetaData = {
  name?: string;
  about?: string;
  picture?: string;
};

// TODO
export const useGroupEditMetadata = (options?: UseAddMemberOptions) => {
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
