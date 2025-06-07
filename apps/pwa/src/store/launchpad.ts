import { create } from 'zustand';
import { ToastType } from '../components/Toast/Toast';
import { Session, User } from '@supabase/supabase-js';
import { ILaunch } from '../types/token';

interface LaunchpadState {
  token:ILaunch | null;
  launch:ILaunch | null;
  setToken: (token: ILaunch | null) => void;
  launchs:ILaunch[] | null;
  setLaunchs: (launchs: ILaunch[] | null) => void;
  setLaunch: (launch: ILaunch | null) => void;
  isInitialFetchToken: boolean;
  setIsInitialFetchToken: (isInitialFetchToken: boolean) => void;
  isInitialFetchLaunch: boolean;
  setIsInitialFetchLaunch: (isInitialFetchLaunch: boolean) => void;
}

export const useLaunchpad = create<LaunchpadState>((set) => ({
  token: null,
  setToken: (token: ILaunch | null) => set({ token }),
  launch: null,
  setLaunch: (launch: ILaunch | null) => set({ launch }),
  launchs: null,
  setLaunchs: (launchs: ILaunch[] | null) => set({ launchs }),
  isInitialFetchToken: false,
  setIsInitialFetchToken: (isInitialFetchToken: boolean) => set({ isInitialFetchToken }),
  isInitialFetchLaunch: false,
  setIsInitialFetchLaunch: (isInitialFetchLaunch: boolean) => set({ isInitialFetchLaunch }),
})); 