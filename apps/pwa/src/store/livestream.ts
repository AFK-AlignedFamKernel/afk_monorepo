import { create } from 'zustand';
import { ICommunity } from '@/types';

interface LivestreamState {
  isWebsocketConnected:boolean;
  setIsWebsocketConnected: (isWebsocketConnected: boolean) => void;
  isInitialLoad: boolean;
  setIsInitialLoad: (isInitialLoad: boolean) => void;
  currentStreamId: string | null;
  setCurrentStreamId: (currentStreamId: string) => void;
}

  export const useLivestreamStore = create<LivestreamState>((set) => ({
  isWebsocketConnected: false,
  setIsWebsocketConnected: (isWebsocketConnected: boolean) => set({ isWebsocketConnected }),
  isInitialLoad: true,
  setIsInitialLoad: (isInitialLoad: boolean) => set({ isInitialLoad }),
  currentStreamId: null,
  setCurrentStreamId: (currentStreamId: string) => set({ currentStreamId }),
})); 