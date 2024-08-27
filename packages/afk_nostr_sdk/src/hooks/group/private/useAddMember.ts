import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {useAuth} from '../../../store';

// TODO
export const useAddMember = () => {
  const {ndk} = useNostrContext();
  const {publicKey} = useAuth();

  return useMutation({
    mutationKey: ['addMemberGroup', ndk],
    mutationFn: async (data: {pubkey: string; groupId: string}) => {
      const event = new NDKEvent(ndk);
      event.kind = NDKKind.GroupAdminAddUser;
      event.tags = [
        ['d', data.groupId],
        ['p', data.pubkey],
      ];
      return event.publish();
    },
  });
};
