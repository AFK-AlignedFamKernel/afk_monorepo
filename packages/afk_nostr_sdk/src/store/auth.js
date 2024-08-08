import { createStore } from 'zustand';
import createBoundedUseStore from './createBoundedUseStore';
export const authStore = createStore((set, get) => ({
    // publicKey and privateKey are set to undefined but we know they are strings
    // so we can cast them as strings without hassle in the app
    publicKey: undefined,
    privateKey: undefined,
    setAuth: (publicKey, privateKey) => {
        set({ publicKey, privateKey });
    },
}));
export const useAuth = createBoundedUseStore(authStore);
