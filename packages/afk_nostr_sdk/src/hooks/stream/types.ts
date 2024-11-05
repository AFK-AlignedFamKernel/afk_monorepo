// Constants
export const LIVE_EVENT_KIND = 30311;
export const LIVE_CHAT_KIND = 1311;

// Types
export type LiveEventStatus = 'planned' | 'live' | 'ended';
export type Role = 'Host' | 'Participant' | 'Speaker';
export interface Participant {
  pubkey: string;
  relay?: string;
  role?: Role;
  proof?: string;
}

export interface LiveEventData {
  identifier: string;
  title?: string;
  summary?: string;
  imageUrl?: string;
  hashtags?: string[];
  streamingUrl?: string;
  recordingUrl?: string;
  startsAt?: number;
  endsAt?: number;
  status: LiveEventStatus;
  currentParticipants?: number;
  totalParticipants?: number;
  participants: Participant[];
  relays?: string[];
  eventId?: string;
}

export interface LiveChatMessage {
  eventId: string;
  content: string;
  pubkey: string;
}

export interface UseLiveEventsOptions {
  status?: LiveEventStatus;
  authors?: string[];
  search?: string;
  hashtag?: string;
  limit?: number;
}
