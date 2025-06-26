import { MintData, ICashuInvoice } from 'afk_nostr_sdk';
import { MeltQuoteResponse, Proof, Token } from '@cashu/cashu-ts';

import { db } from './db';
import * as StorageCashu from '../storage_cashu';

/**
 * Migrates data from AsyncStorage/SecureStore to Dexie IndexedDB
 */
export async function migrateFromLegacyStorage(): Promise<boolean> {
  try {
    console.log('Starting migration from legacy storage to Dexie DB...');
    
    // Migrate mints
    const mints = await StorageCashu.getMints();
    if (mints && mints.length > 0) {
      await db.transaction('rw', db.mints, async () => {
        await db.mints.clear();
        await db.mints.bulkAdd(mints);
      });
      console.log('Migrated mints:', mints.length);
    }
    
    // Migrate proofs
    const proofs = await StorageCashu.getProofs();
    if (proofs && proofs.length > 0) {
      await db.transaction('rw', db.proofs, async () => {
        await db.proofs.clear();
        await db.proofs.bulkAdd(proofs);
      });
      console.log('Migrated proofs:', proofs.length);
    }
    
    // Migrate tokens
    const tokens = await StorageCashu.getTokens();
    if (tokens && tokens.length > 0) {
      await db.transaction('rw', db.tokens, async () => {
        await db.tokens.clear();
        await db.tokens.bulkAdd(tokens);
      });
      console.log('Migrated tokens:', tokens.length);
    }
    
    // Migrate quotes
    const quotes = await StorageCashu.getQuotes();
    if (quotes && quotes.length > 0) {
      await db.transaction('rw', db.quotes, async () => {
        await db.quotes.clear();
        await db.quotes.bulkAdd(quotes);
      });
      console.log('Migrated quotes:', quotes.length);
    }
    
    // Migrate invoices
    const invoices = await StorageCashu.getInvoices();
    if (invoices && invoices.length > 0) {
      await db.transaction('rw', db.invoices, async () => {
        await db.invoices.clear();
        await db.invoices.bulkAdd(invoices);
      });
      console.log('Migrated invoices:', invoices.length);
    }
    
    // Migrate transactions
    const transactions = await StorageCashu.getTransactions();
    if (transactions && transactions.length > 0) {
      await db.transaction('rw', db.transactions, async () => {
        await db.transactions.clear();
        await db.transactions.bulkAdd(transactions);
      });
      console.log('Migrated transactions:', transactions.length);
    }
    
    // Migrate settings
    const activeMint = await StorageCashu.getActiveMint();
    if (activeMint) {
      await db.settings.put({ key: 'ACTIVE_MINT', value: activeMint });
      console.log('Migrated active mint:', activeMint);
    }
    
    const activeUnit = await StorageCashu.getActiveUnit();
    if (activeUnit) {
      await db.settings.put({ key: 'ACTIVE_UNIT', value: activeUnit });
      console.log('Migrated active unit:', activeUnit);
    }
    
    const signerType = await StorageCashu.getSignerType();
    if (signerType) {
      await db.settings.put({ key: 'SIGNER_TYPE', value: signerType });
      console.log('Migrated signer type:', signerType);
    }
    
    const signerPrivKey = await StorageCashu.getSignerPrivKey();
    if (signerPrivKey) {
      await db.settings.put({ key: 'PRIVATEKEY_SIGNER', value: signerPrivKey });
      console.log('Migrated private key signer');
    }
    
    const walletId = await StorageCashu.getWalletId();
    if (walletId) {
      await db.settings.put({ key: 'WALLET_ID', value: walletId });
      console.log('Migrated wallet ID:', walletId);
    }
    
    console.log('Migration complete!');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
} 