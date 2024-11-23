import {MeltQuoteResponse, Proof, Token} from '@cashu/cashu-ts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ICashuInvoice} from 'afk_nostr_sdk';
import {MintData} from 'afk_nostr_sdk/src/hooks/cashu/useCashu';
import * as SecureStore from 'expo-secure-store';
import {Platform} from 'react-native';

const isSecureStoreAvailable = Platform.OS === 'android' || Platform.OS === 'ios';

export const KEY_CASHU_STORE = {
  INVOICES: 'INVOICES',
  TRANSACTIONS: 'TRANSACTIONS',
  QUOTES: 'QUOTES',
  TOKENS: 'TOKENS',
  PROOFS: 'PROOFS',
  MINTS: 'MINTS',
  ACTIVE_MINT: 'ACTIVE_MINT',
  ACTIVE_UNIT: 'ACTIVE_UNIT',
  SIGNER_TYPE: 'SIGNER_TYPE',
  PRIVATEKEY_SIGNER: 'PRIVATEKEY_SIGNER',
  WALLET_ID: 'WALLET_ID',
} as const;

// Add error handling helper
const handleStorageError = (error: unknown, operation: string) => {
  console.error(`Error during ${operation}:`, error);
  throw error;
};

// Generic store function to reduce code duplication
export const storeData = async <T>(key: string, value: T) => {
  try {
    const jsonValue = JSON.stringify(value);
    if (isSecureStoreAvailable) {
      await SecureStore.setItemAsync(key, jsonValue);
    } else {
      await AsyncStorage.setItem(key, jsonValue);
    }
  } catch (error) {
    handleStorageError(error, `storing ${key}`);
  }
};

// Generic get function to reduce code duplication
export const getData = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = isSecureStoreAvailable
      ? await SecureStore.getItemAsync(key)
      : await AsyncStorage.getItem(key);

    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    handleStorageError(error, `retrieving ${key}`);
    return null;
  }
};

// Specific implementations using the generic functions
export const storeTokens = (tokens: Token[]) => storeData(KEY_CASHU_STORE.TOKENS, tokens);

export const getTokens = () => getData<Token[]>(KEY_CASHU_STORE.TOKENS);

export const storeQuotes = (quotes: MeltQuoteResponse[]) =>
  storeData(KEY_CASHU_STORE.QUOTES, quotes);

export const getQuotes = () => getData<MeltQuoteResponse[]>(KEY_CASHU_STORE.QUOTES);

export const storeProofs = (proofs: Proof[]) => storeData(KEY_CASHU_STORE.PROOFS, proofs);

export const getProofs = () => getData<Proof[]>(KEY_CASHU_STORE.PROOFS);

export const storeInvoices = (invoices: ICashuInvoice[]) =>
  storeData(KEY_CASHU_STORE.INVOICES, invoices);

export const getInvoices = () => getData<ICashuInvoice[]>(KEY_CASHU_STORE.INVOICES);

export const storeMints = (mints: MintData[]) => storeData(KEY_CASHU_STORE.MINTS, mints);

export const getMints = () => getData<MintData[]>(KEY_CASHU_STORE.MINTS);

export const storeActiveMint = (mint: string) => storeData(KEY_CASHU_STORE.ACTIVE_MINT, mint);

export const getActiveMint = () => getData<string>(KEY_CASHU_STORE.ACTIVE_MINT);

export const storeActiveUnit = (unit: string) => storeData(KEY_CASHU_STORE.ACTIVE_UNIT, unit);

export const getActiveUnit = () => getData<string>(KEY_CASHU_STORE.ACTIVE_UNIT);

export const storeTransactions = (transactions: ICashuInvoice[]) =>
  storeData(KEY_CASHU_STORE.TRANSACTIONS, transactions);

export const getTransactions = () => getData<ICashuInvoice[]>(KEY_CASHU_STORE.TRANSACTIONS);

export const storeSignerType = (type: string) => storeData(KEY_CASHU_STORE.SIGNER_TYPE, type);

export const getSignerType = () => getData<string>(KEY_CASHU_STORE.SIGNER_TYPE);

export const storeSignerPrivKey = (key: string) =>
  storeData(KEY_CASHU_STORE.PRIVATEKEY_SIGNER, key);

export const getSignerPrivKey = () => getData<string>(KEY_CASHU_STORE.PRIVATEKEY_SIGNER);

export const storeWalletId = (id: string) => storeData(KEY_CASHU_STORE.WALLET_ID, id);

export const getWalletId = () => getData<string>(KEY_CASHU_STORE.WALLET_ID);
