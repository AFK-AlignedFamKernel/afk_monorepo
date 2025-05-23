import { create } from 'zustand';
import { ToastType } from '../components/Toast/Toast';
import { Session, User } from '@supabase/supabase-js';

interface AppState {
  user:User | null;
  session:Session | null;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  isInitialFetchUser: boolean;
  setIsInitialFetchUser: (isInitialFetchUser: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  setUser: (user: User | null) => set({ user }),
  session: null,
  setSession: (session: Session | null) => set({ session }),  
  isInitialFetchUser: false,
  setIsInitialFetchUser: (isInitialFetchUser: boolean) => set({ isInitialFetchUser }),
})); 