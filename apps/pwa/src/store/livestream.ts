import { create } from 'zustand';
import { ICommunity } from '@/types';
import { NDKEvent } from '@nostr-dev-kit/ndk';

export interface EventLivestreamNostr extends NDKEvent {
  identifier: string;
  eventId: string;
  title: string;
  summary: string;
  status: string;
  startDate: Date;
  endDate: Date;
  hashtags: string[];
  participants: {
    role: 'Host' | 'Speaker' | 'Participant';
    pubkey: string;
  }[];
  recordingUrl?: string;
  streamingUrl?: string;
}

interface LivestreamState {
  isWebsocketConnected: boolean;
  setIsWebsocketConnected: (isWebsocketConnected: boolean) => void;
  isInitialLoad: boolean;
  setIsInitialLoad: (isInitialLoad: boolean) => void;
  currentStreamId: string | null;
  setCurrentStreamId: (currentStreamId: string) => void;
  noteEvent: EventLivestreamNostr | null | undefined;
  setNoteEvent: (noteEvent: EventLivestreamNostr | null | undefined | NDKEvent) => void;
  nostrNoteEvent: NDKEvent | null | undefined;
  setNostrNoteEvent: (noteEvent: NDKEvent | null | undefined) => void;
}

export const useLivestreamStore = create<LivestreamState>((set) => ({
  isWebsocketConnected: false,
  setIsWebsocketConnected: (isWebsocketConnected: boolean) => set({ isWebsocketConnected }),
  isInitialLoad: true,
  setIsInitialLoad: (isInitialLoad: boolean) => set({ isInitialLoad }),
  currentStreamId: null,
  setCurrentStreamId: (currentStreamId: string) => set({ currentStreamId }),
  noteEvent: undefined,
  setNoteEvent: (noteEvent: EventLivestreamNostr | null | undefined) => set({ noteEvent }),
  nostrNoteEvent: undefined,
  setNostrNoteEvent: (noteEvent: NDKEvent | null | undefined) => set({ nostrNoteEvent: noteEvent }),
})); 