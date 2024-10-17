import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';
import {useNostrContext} from '../../context/NostrContext';
import {uploadToPinata} from '../../utils/pinata';
import crypto from 'crypto';
import {calculateSHA256} from '../../utils/fileUtils';

export const useSendVideo = () => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['sendVideo', ndk],
    mutationFn: async (data: {
      content: string;
      videoUri: string;
      kind?: NDKKind.VerticalVideo | NDKKind.HorizontalVideo;
      title: string;
      duration?: number;
      alt?: string;
      contentWarning?: string;
      additionalTags?: string[][];
    }) => {
      // Upload to Pinata
      const cid = await uploadToPinata(data.videoUri);

      const event = new NDKEvent(ndk);
      event.kind = data?.kind ?? NDKKind.VerticalVideo;
      event.content = data.content;

      // Add required NIP-71 tags
      event.tags = [
        ['d', crypto.randomUUID()], // Unique identifier
        ['title', data.title],
        ['published_at', Math.floor(Date.now() / 1000).toString()],
        ['imeta', 
          `url https://gateway.pinata.cloud/ipfs/${cid}`,
          `x ${await calculateSHA256(data.videoUri)}`,
          'service nip96'
        ],
      ];

      // Add optional NIP-71 tags
      if (data.duration) {
        event.tags.push(['duration', data.duration.toString()]);
      }
      if (data.alt) {
        event.tags.push(['alt', data.alt]);
      }
      if (data.contentWarning) {
        event.tags.push(['content-warning', data.contentWarning]);
      }

      // Add any additional tags
      if (data.additionalTags) {
        event.tags.push(...data.additionalTags);
      }

      return event.publish();
    },
  });
};
