import {useMutation} from '@tanstack/react-query';
import {useNostrContext} from '../../../context/NostrContext';
import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';

export type UseDeleteEventGroupOptions = {
  authors?: string[];
  search?: string;
};

// TODO
export const useDeleteGroup = () => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['deleteGroup', ndk],
    mutationFn: async (data: {groupId: string}) => {
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.GroupAdminDeleteGroup;
      event.tags = [['d', data.groupId]];
      return event.publish();
    },
  });
};
