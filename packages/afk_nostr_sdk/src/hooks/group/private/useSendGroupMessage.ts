import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {useAuth} from '../../../store';
import {AdminGroupPermission} from './useAddPermissions';
import {checkGroupPermission} from './useGetPermission';

// TODO
export const useSendGroupMessages = () => {
  const {ndk} = useNostrContext();
  const {publicKey: pubkey} = useAuth();

  return useMutation({
    mutationKey: ['sendGroupMessage'],
    mutationFn: async (data: {
      pubkey: string;
      content: string;
      groupId: string;
      name?: string;
      replyId: string;
    }) => {
      const event = new NDKEvent(ndk);

      const hasPermission = await checkGroupPermission({
        groupId: data.groupId,
        ndk,
        pubkey,
        action: AdminGroupPermission.ViewAccess,
      });

      if (!hasPermission) {
        throw new Error('You do not have permission to send message');
      }

      event.content = data.content;
      // Set the kind based on whether it's a reply or not
      event.kind = data.replyId ? 12 as NDKKind : 11 as NDKKind; // Using literal kind values
      // kinds: [NDKKind.GroupNote = 11, NDKKind.GroupReply = 12],

      // Base tags
      event.tags = [
        ['h', data.groupId],
        ['p', data.pubkey],
        ['name', data.name],
      ];

      // Check if it's a reply and append NIP-10 markers
      if (data.replyId) {
        event.tags.push(['e', data.replyId, '', 'reply']);
      }
      return event.publish();
    },
  });
};
