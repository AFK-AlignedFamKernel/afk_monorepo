import {NDKEvent, NDKKind} from '@nostr-dev-kit/ndk';
import {useMutation} from '@tanstack/react-query';

import {useNostrContext} from '../context';

type VideoMetadata = {
  dimension: string;
  url: string;
  sha256: string;
  mimeType: string;
  imageUrls: string[];
  fallbackUrls: string[];
  useNip96?: boolean;
};

type VideoEventData = {
  content: string;
  title: string;
  publishedAt: number;
  isVertical: boolean;
  videoMetadata: VideoMetadata[];
  duration?: number;
  textTracks?: Array<{url: string; type: string; lang?: string}>;
  contentWarning?: string;
  alt?: string;
  segments?: Array<{start: string; end: string; title: string; thumbnailUrl?: string}>;
  hashtags?: string[];
  participants?: Array<{pubkey: string; relayUrl?: string}>;
  references?: string[];
};

export const useSendVideoEvent = () => {
  const {ndk} = useNostrContext();

  return useMutation({
    mutationKey: ['sendVideoEvent', ndk],
    mutationFn: async (data: VideoEventData) => {
      const event = new NDKEvent(ndk);
      event.kind = data?.isVertical ? NDKKind.VerticalVideo : NDKKind.HorizontalVideo;
      event.content = data?.content;

      event.tags = [
        ['d', crypto.randomUUID()],
        ['title', data.title],
        ['published_at', data.publishedAt.toString()],
      ];

      if (data.alt) event.tags.push(['alt', data.alt]);
      if (data.duration) event.tags.push(['duration', data.duration.toString()]);
      if (data.contentWarning) event.tags.push(['content-warning', data.contentWarning]);

      data.videoMetadata.forEach((meta) => {
        const imetaTag = [
          'imeta',
          `dim ${meta.dimension}`,
          `url ${meta.url}`,
          `x ${meta.sha256}`,
          `m ${meta.mimeType}`,
          ...meta.imageUrls.map((url) => `image ${url}`),
          ...meta.fallbackUrls.map((url) => `fallback ${url}`),
        ];
        if (meta.useNip96) imetaTag.push('service nip96');
        event.tags.push(imetaTag);
      });

      data.textTracks?.forEach((track) => {
        event.tags.push(['text-track', track.url, track.type, track.lang].filter(Boolean));
      });

      data.segments?.forEach((segment) => {
        event.tags.push(
          ['segment', segment.start, segment.end, segment.title, segment.thumbnailUrl].filter(
            Boolean,
          ),
        );
      });

      data.hashtags?.forEach((tag) => event.tags.push(['t', tag]));
      data.participants?.forEach((participant) =>
        event.tags.push(['p', participant.pubkey, participant.relayUrl].filter(Boolean)),
      );
      data.references?.forEach((ref) => event.tags.push(['r', ref]));

      return event.publish();
    },
  });
};
