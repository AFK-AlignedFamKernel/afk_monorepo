import {useMutation} from '@tanstack/react-query';
import {useNostrContext} from '../../../context/NostrContext';
import {useAuth} from '../../../store';
import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';

export type UseRemoveMemberOptions = {
  authors?: string[];
  search?: string;
};

// TODO
export const useRemoveMember = (options?: UseRemoveMemberOptions) => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['removeMemberGroup', ndk],
    mutationFn: async (data: {pubkey: string; groupId: string}) => {
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.GroupAdminRemoveUser;
      event.tags = [
        ['d', data.groupId],
        ['p', data.pubkey],
      ];
      return event.publish();
    },
  });
};
