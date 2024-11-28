import {ArgentTMA} from '@argent/tma-wallet';
import {useSyncExternalStore} from 'react';

// Define the type for our store
type ArgentTMAStore = {
  argentTMA: ArgentTMA | null;
  isInitialized: boolean;
};

// Create the store
let store: ArgentTMAStore = {
  argentTMA: null,
  isInitialized: false,
};

// List of subscribers
const subscribers = new Set<() => void>();

// Function to subscribe to store changes
const subscribe = (callback: () => void) => {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
};

// Function to get the current store state
const getSnapshot = () => store;

// Function to initialize ArgentTMA
const initArgentTMA = () => {
  if (!store.isInitialized) {
    store = {
      argentTMA: ArgentTMA.init({
        environment: 'sepolia',
        appName: 'My TG Mini Test Dapp',
        appTelegramUrl:
          process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL ?? 'https://t.me/afk_aligned_dev_bot',
        sessionParams: {
          allowedMethods: [
            {
              contract: '0x036133c88c1954413150db74c26243e2af77170a4032934b275708d84ec5452f',
              selector: 'increment',
            },
          ],
          validityDays: 90,
        },
      }),
      isInitialized: true,
    };
    subscribers.forEach((callback) => callback());
  }
};

// Custom hook to use ArgentTMA
export const useArgentTMA = () => {
  const store = useSyncExternalStore(subscribe, getSnapshot);

  // Initialize ArgentTMA if it hasn't been initialized yet
  if (!store.isInitialized) {
    initArgentTMA();
  }

  return store.argentTMA;
};
