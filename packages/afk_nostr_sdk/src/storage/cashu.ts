import {MeltQuoteResponse, Proof, Token} from '@cashu/cashu-ts';
import {ICashuInvoice} from '../types';

export const KEY_CASHU_STORE = {
  INVOICES: 'INVOICES',
  QUOTES: 'QUOTES',
  TOKENS: 'TOKENS',
  PROOFS: 'PROOFS',
  PROOFS_SPENT: 'PROOFS_SPENT',
  TRANSACTIONS: 'TRANSACTIONS',
};
export const storeTokens = (tokens: Token[]) => {
  localStorage.setItem(KEY_CASHU_STORE.TOKENS, JSON.stringify(tokens));
};

export const getTokens = () => {
  return localStorage.getItem(KEY_CASHU_STORE.TOKENS);
};

export const storeQuotes = (quotes: MeltQuoteResponse[]) => {
  localStorage.setItem(KEY_CASHU_STORE.QUOTES, JSON.stringify(quotes));
};

export const getQuotes = () => {
  return localStorage.getItem(KEY_CASHU_STORE.QUOTES);
};

export const storeProofs = (proofs: Proof[]) => {
  localStorage.setItem(KEY_CASHU_STORE.PROOFS, JSON.stringify(proofs));
};

export const getProofs = () => {
  return localStorage.getItem(KEY_CASHU_STORE.PROOFS);
};

export const getInvoices = () => {
  return localStorage.getItem(KEY_CASHU_STORE.INVOICES);
};

export const storeInvoices = (invoices: ICashuInvoice[]) => {
  localStorage.setItem(KEY_CASHU_STORE.INVOICES, JSON.stringify(invoices));
};

export const getTransactions = () => {
  return localStorage.getItem(KEY_CASHU_STORE.TRANSACTIONS);
};

export const storeTransactions = (transactions: ICashuInvoice[]) => {
  localStorage.setItem(KEY_CASHU_STORE.TRANSACTIONS, JSON.stringify(transactions));
};

export const addProofs = (proofsToAdd: Proof[]) => {
  const proofsLocal = getProofs();
  if (!proofsLocal) {
    storeProofs([...(proofsToAdd as Proof[])]);
  } else {
    const proofs: Proof[] = JSON.parse(proofsLocal);
    storeProofs([...proofs, ...(proofsToAdd as Proof[])]);
  }
};

export const storeProofsSpent = (proofs: Proof[]) => {
  localStorage.setItem(KEY_CASHU_STORE.PROOFS_SPENT, JSON.stringify(proofs));
};

export const getProofsSpent = () => {
  return localStorage.getItem(KEY_CASHU_STORE.PROOFS_SPENT);
};
export const addProofsSpent = (proofsToAdd: Proof[]) => {
  const proofsLocal = getProofsSpent();
  if (!proofsLocal) {
    storeProofsSpent([...(proofsToAdd as Proof[])]);
    return proofsToAdd;
  } else {
    const proofs: Proof[] = JSON.parse(proofsLocal);
    storeProofsSpent([...proofs, ...(proofsToAdd as Proof[])]);
    return proofs;
  }
};

export const updateProofsSpent = (proofsToAdd: Proof[]) => {
  const proofsLocal = getProofsSpent();
  if (!proofsLocal) {
    storeProofsSpent([...(proofsToAdd as Proof[])]);
  } else {
    storeProofsSpent([...(proofsToAdd as Proof[])]);
  }
  return proofsToAdd;
};
