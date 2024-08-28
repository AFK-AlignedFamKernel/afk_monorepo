import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../../../context/NostrContext';

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
    }) => {
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
    },
  });
};

// const data = [
//   {
//     id: 1,
//     content: 'Root Note',
//     tags: [
//       ['h', 'groupId'],
//       ['p', 'pubKey'],
//       ['name', 'nip4'],
//     ],
//   },
//   {
//     id: 2,
//     content: 'Reply root Note',
//     tags: [
//       ['h', 'groupId'],
//       ['p', 'pubKey'],
//       ['name', 'nip4'],
//       ['e', 1, '', 'reply'],
//     ],

//     reply: {
//       id: 1,
//       content: 'Root Note',
//       tags: [
//         ['h', 'groupId'],
//         ['p', 'pubKey'],
//         ['name', 'nip4'],
//       ],
//     },
//   },
// ];
