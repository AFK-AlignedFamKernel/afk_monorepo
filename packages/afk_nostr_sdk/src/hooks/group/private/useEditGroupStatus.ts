import {useMutation} from '@tanstack/react-query';
import {useNostrContext} from '../../../context/NostrContext';
import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
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
    mutationFn: async (data: {groupId: string; status: GroupStatus}) => {
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.GroupAdminEditStatus;
      event.tags = [['d', data.groupId], objectToTagArray(data.status)[0]];
      return event.publish();
    },
  });
};
