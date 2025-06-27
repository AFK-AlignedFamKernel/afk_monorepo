import { create } from 'zustand';
import { ICommunity, IMessage } from '@/types';

interface MessagesState {
  messages: IMessage[] | null;
  setMessages: (messages: IMessage[] | null) => void;
}

export const useMessagesStore = create<MessagesState>((set) => ({
  messages: null,
  setMessages: (messages: IMessage[] | null) => set({ messages }),
})); 