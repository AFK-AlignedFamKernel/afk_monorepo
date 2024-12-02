// hooks/useStorageState.ts
import {MeltQuoteResponse, Proof, Token} from '@cashu/cashu-ts';
import {ICashuInvoice} from 'afk_nostr_sdk';
import {MintData} from 'afk_nostr_sdk/src/hooks/cashu/useCashu';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Platform} from 'react-native';

import {getData, KEY_CASHU_STORE, storeData} from '../utils/storage_cashu';

export function useStorageState<T>(
  key: keyof typeof KEY_CASHU_STORE,
  initialValue: T,
  options?: {
    pollInterval?: number;
  },
) {
  const [state, setState] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedInitialValue = useMemo(() => initialValue, []);

  const fetchValue = useCallback(async () => {
    try {
      const value = (await getData(KEY_CASHU_STORE[key])) as string | null;

      if (value) {
        try {
          setState(value as T);
        } catch (parseError) {
          console.error('Error parsing stored value:', parseError);
          setState(memoizedInitialValue);
        }
      } else {
        setState(memoizedInitialValue);
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch storage value'));
      console.error(`Error fetching ${key}:`, e);
    } finally {
      setIsLoading(false);
    }
  }, [key, memoizedInitialValue]);

  const handleWebStorageChange = useCallback(
    (event: StorageEvent) => {
      if (event.key === KEY_CASHU_STORE[key] && event.newValue) {
        try {
          const newValue = JSON.parse(event.newValue) as T;
          setState(newValue);
        } catch (e) {
          console.error('Error parsing storage value:', e);
        }
      }
    },
    [key],
  );

  const setValue = useCallback(
    async (newValue: T | ((prev: T) => T)) => {
      try {
        const valueToStore = newValue instanceof Function ? newValue(state) : newValue;
        await storeData(KEY_CASHU_STORE[key], valueToStore);
        setState(valueToStore);

        if (Platform.OS === 'web') {
          window.dispatchEvent(
            new StorageEvent('storage', {
              key: KEY_CASHU_STORE[key],
              newValue: JSON.stringify(valueToStore),
            }),
          );
        }
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to store value'));
        console.error(`Error storing ${key}:`, e);
      }
    },
    [key, state],
  );

  const isInitialMount = useRef(true);

  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval> | undefined;

    if (isInitialMount.current) {
      fetchValue();
      isInitialMount.current = false;
    }

    if (options?.pollInterval && options.pollInterval > 0) {
      pollInterval = setInterval(fetchValue, options.pollInterval);
    }

    if (Platform.OS === 'web') {
      window.addEventListener('storage', handleWebStorageChange);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (Platform.OS === 'web') {
        window.removeEventListener('storage', handleWebStorageChange);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const refresh = useCallback(() => {
    fetchValue();
  }, [fetchValue]);

  return {
    value: state,
    setValue,
    isLoading,
    error,
    refresh,
  };
}

// Typed versions
export const useMintStorage = (options?: {pollInterval?: number}) => {
  const hook = useStorageState<MintData[]>('MINTS', [], options);
  return useMemo(() => hook, [hook]);
};

export const useActiveMintStorage = (options?: {pollInterval?: number}) => {
  const hook = useStorageState<string>('ACTIVE_MINT', '', options);
  return useMemo(() => hook, [hook]);
};

export const useProofsStorage = (options?: {pollInterval?: number}) => {
  const hook = useStorageState<Proof[]>('PROOFS', [], options);
  return useMemo(() => hook, [hook]);
};

export const useTokensStorage = (options?: {pollInterval?: number}) => {
  const hook = useStorageState<Token[]>('TOKENS', [], options);
  return useMemo(() => hook, [hook]);
};

export const useQuotesStorage = (options?: {pollInterval?: number}) => {
  const hook = useStorageState<MeltQuoteResponse[]>('QUOTES', [], options);
  return useMemo(() => hook, [hook]);
};

export const useInvoicesStorage = (options?: {pollInterval?: number}) => {
  const hook = useStorageState<ICashuInvoice[]>('INVOICES', [], options);
  return useMemo(() => hook, [hook]);
};

export const useActiveUnitStorage = (options?: {pollInterval?: number}) => {
  const hook = useStorageState<string>('ACTIVE_UNIT', '', options);
  return useMemo(() => hook, [hook]);
};

export const useTransactionsStorage = (options?: {pollInterval?: number}) => {
  const hook = useStorageState<ICashuInvoice[]>('TRANSACTIONS', [], options);
  return useMemo(() => hook, [hook]);
};

export const useSignerTypeStorage = (options?: {pollInterval?: number}) => {
  const hook = useStorageState<string>('SIGNER_TYPE', '', options);
  return useMemo(() => hook, [hook]);
};

export const usePrivKeySignerStorage = (options?: {pollInterval?: number}) => {
  const hook = useStorageState<string>('PRIVATEKEY_SIGNER', '', options);
  return useMemo(() => hook, [hook]);
};

export const useWalletIdStorage = (options?: {pollInterval?: number}) => {
  const hook = useStorageState<string>('WALLET_ID', '', options);
  return useMemo(() => hook, [hook]);
};
