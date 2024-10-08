import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {Platform} from 'react-native';

import {pbkdf2Decrypt, pbkdf2Encrypt, PBKDF2EncryptedObject} from './encryption';
import {MeltQuoteResponse, Proof, Token} from '@cashu/cashu-ts';
import {ICashuInvoice} from 'afk_nostr_sdk';

const isSecureStoreAvailable = Platform.OS === 'android' || Platform.OS === 'ios';
export const KEY_CASHU_STORE = {
  INVOICES: 'INVOICES',
  QUOTES: 'QUOTES',
  TOKENS: 'TOKENS',
  PROOFS: 'PROOFS',
};
export const storeTokens = async (tokens: Token[]) => {
  if (isSecureStoreAvailable) {
    return SecureStore.setItemAsync(KEY_CASHU_STORE.TOKENS, JSON.stringify(tokens));
  }

  return AsyncStorage.setItem(KEY_CASHU_STORE.TOKENS, JSON.stringify(tokens));
};

export const getTokens = async () => {
  if (isSecureStoreAvailable) {
    return SecureStore.getItemAsync(KEY_CASHU_STORE.QUOTES);
  }

  return AsyncStorage.getItem(KEY_CASHU_STORE.PROOFS);
};

export const storeQuotes = async (quotes: MeltQuoteResponse[]) => {
  if (isSecureStoreAvailable) {
    return SecureStore.setItemAsync(KEY_CASHU_STORE.QUOTES, JSON.stringify(quotes));
  }

  return AsyncStorage.setItem(KEY_CASHU_STORE.QUOTES, JSON.stringify(quotes));
};

export const getQuotes = async (proofs: Proof[]) => {
  if (isSecureStoreAvailable) {
    return SecureStore.getItemAsync(KEY_CASHU_STORE.QUOTES);
  }

  return AsyncStorage.getItem(KEY_CASHU_STORE.QUOTES);
};

export const storeProofs = async (proofs: Proof[]) => {
  if (isSecureStoreAvailable) {
    return SecureStore.setItemAsync(KEY_CASHU_STORE.PROOFS, JSON.stringify(proofs));
  }

  return AsyncStorage.setItem(KEY_CASHU_STORE.PROOFS, JSON.stringify(proofs));
};

export const getProofs = async (proofs: Proof[]) => {
  if (isSecureStoreAvailable) {
    return SecureStore.getItemAsync(KEY_CASHU_STORE.PROOFS);
  }

  return AsyncStorage.getItem(KEY_CASHU_STORE.PROOFS);
};

export const getInvoices = async () => {
  if (isSecureStoreAvailable) {
    return SecureStore.getItem(KEY_CASHU_STORE.INVOICES);
  }

  return AsyncStorage.getItem(KEY_CASHU_STORE.INVOICES);
};

export const storeInvoices = async (invoices: ICashuInvoice[]) => {
  if (isSecureStoreAvailable) {
    return SecureStore.setItemAsync(KEY_CASHU_STORE.INVOICES, JSON.stringify(invoices));
  }

  return AsyncStorage.setItem(KEY_CASHU_STORE.INVOICES, JSON.stringify(invoices));
};
