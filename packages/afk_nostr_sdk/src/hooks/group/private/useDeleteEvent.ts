import {useMutation} from '@tanstack/react-query';
import {useNostrContext} from '../../../context/NostrContext';
import {useAuth} from '../../../store';
import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';

export type UseDeleteEventGroupOptions = {
  authors?: string[];
  search?: string;
};

// TODO
export const useDeleteEvent = (options?: UseDeleteEventGroupOptions) => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['deleteEventGroup', ndk],
    mutationFn: async (data: {id: string; groupId: string}) => {
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.GroupAdminDeleteEvent;
      event.tags = [
        ['d', data.groupId],
        ['e', data.id],
      ];
      return event.publish();
    },
  });
};
