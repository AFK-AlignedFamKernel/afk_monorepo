import { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';

export const SORT_OPTION_EVENT_NOSTR = {
  TIME: 0,
  TRENDING: 1,
  FOR_YOU: 2,
  INTERESTS: 3,
};

export enum NostrEventKind {
  Text = 1,
  RecommendRelay = 2,
  Contacts = 3,
  EncryptedDirectMessage = 4,
  EventDeletion = 5,
  Repost = 6,
  Reaction = 7,
  ChannelCreation = 40,
  ChannelMetadata = 41,
  ChannelMessage = 42,
  ChannelHideMessage = 43,
  ChannelMuteUser = 44,
  Metadata = 0,
  Article = 30023,
  VerticalVideo = 31000,
  HorizontalVideo = 31001,
  ShortForm = 1311,
}

export interface NostrEventBase {
  event: NDKEvent;
  profile?: {
    name?: string;
    displayName?: string;
    picture?: string;
    about?: string;
    nip05?: string;
    lud16?: string;
    lud06?: string;
    banner?: string;
  };
  isLoading?: boolean;
  isClickableHashtags?: boolean;
}

export interface NostrPostEventProps extends NostrEventBase {}
export interface NostrArticleEventProps extends NostrEventBase {}
export interface NostrShortEventProps extends NostrEventBase {}

export function getEventKind(event: NDKEvent): NostrEventKind | undefined {
  return event.kind as NostrEventKind;
}

export function formatTimestamp(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString();
}

export function truncate(str: string, length: number): string {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
} 