import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';
import {AdminGroupPermission} from './useAddPermissions';

// TODO
export const useSendGroupMessages = () => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['sendGroupMessage', ndk],
    mutationFn: async (data: {
      pubkey: string;
      content: string;
      groupId: string;
      name?: string;
      replyId: string;
      permissionData: AdminGroupPermission[];
    }) => {
      if (data.permissionData && !data.permissionData.includes(AdminGroupPermission.ViewAccess)) {
        console.log('Hit here');
        throw new Error('You do not have permission to send message');
      } else {
        const event = new NDKEvent(ndk);
        event.content = data.content;
        // Set the kind based on whether it's a reply or not
        event.kind = data.replyId ? NDKKind.GroupReply : NDKKind.GroupNote; // Using literal kind values

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
      }
    },
  });
};
