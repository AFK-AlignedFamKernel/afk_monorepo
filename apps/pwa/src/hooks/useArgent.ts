'use client';
import {ArgentTMA} from '@argent/tma-wallet';
import {useEffect, useState} from 'react';

type ArgentTMAInstance = ReturnType<typeof ArgentTMA.init>;

const link = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL;
export function useArgentTMA() {
  const [argentTMA, setArgentTMA] = useState<ArgentTMAInstance | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initArgentTMA = async () => {
      // Only initialize if we have the Telegram WebApp available
      if (typeof window === 'undefined' || !window?.Telegram?.WebApp) {
        setError(new Error('Telegram WebApp not available'));
        setIsInitializing(false);
        return;
      }

      try {
        // Dynamic import of ArgentTMA to avoid nextjs self reference error.
        const {ArgentTMA} = await import('@argent/tma-wallet');
        const instance = ArgentTMA.init({
          environment: 'sepolia',
          appName: 'My TG Mini Test Dapp',
          appTelegramUrl: link ?? 'https://t.me/afk_aligned_dev_bot',
          sessionParams: {
            allowedMethods: [
              {
                contract: '0x036133c88c1954413150db74c26243e2af77170a4032934b275708d84ec5452f',
                selector: 'increment',
              },
            ],
            validityDays: 90, // session validity (in days) - default: 90
          },
        });

        console.log('ArgentTMA instance initialized:', instance);
        setArgentTMA(instance);
      } catch (err) {
        console.error('Failed to initialize ArgentTMA:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize ArgentTMA'));
      } finally {
        setIsInitializing(false);
      }
    };

    initArgentTMA();
  }, []);

  return {argentTMA, error, isInitializing};
}
