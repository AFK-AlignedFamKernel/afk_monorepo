import { 
  db, 
  mintsApi, 
  proofsApi, 
  proofsByMintApi, 
  invoicesApi,
  settingsApi 
} from './storage';
import { Proof, MintQuoteState } from '@cashu/cashu-ts';
import { v4 as uuidv4 } from 'uuid';

/**
 * Legacy localStorage keys for the old storage system
 */
const LEGACY_KEYS = {
  PROOFS: 'cashu_proofs',
  MINTS: 'cashu_mints',
  ACTIVE_MINT: 'cashu_active_mint',
  ACTIVE_UNIT: 'cashu_active_unit',
  TRANSACTIONS: 'cashu_transactions',
  TOKENS: 'cashu_tokens',
  WALLET_DATA: 'cashu_wallet_data',
};

/**
 * Migrates data from localStorage to Dexie IndexedDB
 * @returns {Promise<boolean>} True if migration was successful
 */
export async function migrateFromLegacyStorage(): Promise<boolean> {
  try {
    console.log('Starting migration from legacy storage to Dexie DB...');
    let migrationCount = 0;
    
    // Check if we've already migrated
    const hasMigrated = await settingsApi.get('MIGRATION_COMPLETE', 'false');
    if (hasMigrated) {
      console.log('Migration already completed previously');
      return true;
    }
    
    // Migrate wallet data
    const walletDataStr = localStorage.getItem(LEGACY_KEYS.WALLET_DATA);
    if (walletDataStr) {
      try {
        const walletData = JSON.parse(walletDataStr);
        
        // Migrate mints
        if (walletData.mints && walletData.mints.length > 0) {
          await mintsApi.setAll(walletData.mints);
          console.log(`Migrated ${walletData.mints.length} mints`);
          migrationCount++;
        }
        
        // Migrate active mint
        if (walletData.activeMint) {
          await settingsApi.set('ACTIVE_MINT', walletData.activeMint);
          console.log('Migrated active mint:', walletData.activeMint);
          migrationCount++;
        }
        
        // Migrate active unit
        if (walletData.activeUnit) {
          await settingsApi.set('ACTIVE_UNIT', walletData.activeUnit);
          console.log('Migrated active unit:', walletData.activeUnit);
          migrationCount++;
        }
        
        // Migrate transactions
        if (walletData.transactions && walletData.transactions.length > 0) {
          // Ensure each transaction has a proper ID
          const transactions = walletData.transactions.map(tx => ({
            ...tx,
            id: tx.id || uuidv4()
          }));
          
          // Save to database
          await db.transactions.bulkAdd(transactions);
          console.log(`Migrated ${transactions.length} transactions`);
          migrationCount++;
        }
      } catch (err) {
        console.error('Error parsing wallet data during migration:', err);
      }
    }
    
    // Migrate individual proofs
    const proofsStr = localStorage.getItem(LEGACY_KEYS.PROOFS);
    if (proofsStr) {
      try {
        const proofs = JSON.parse(proofsStr) as Proof[];
        if (proofs && proofs.length > 0) {
          // Get active mint
          const activeMint = await settingsApi.get('ACTIVE_MINT', '');
          
          // Save proofs to general proofs table
          await proofsApi.setAll(proofs);
          
          // If we have an active mint, also save as mint-specific proofs
          if (activeMint) {
            await proofsByMintApi.setAllForMint(proofs, activeMint);
          }
          
          console.log(`Migrated ${proofs.length} proofs`);
          migrationCount++;
        }
      } catch (err) {
        console.error('Error migrating proofs:', err);
      }
    }
    
    // Migrate tokens
    const tokensStr = localStorage.getItem(LEGACY_KEYS.TOKENS);
    if (tokensStr) {
      try {
        const tokens = JSON.parse(tokensStr);
        if (tokens && tokens.length > 0) {
          await db.tokens.bulkAdd(tokens);
          console.log(`Migrated ${tokens.length} tokens`);
          migrationCount++;
        }
      } catch (err) {
        console.error('Error migrating tokens:', err);
      }
    }
    
    // Mark migration as complete
    if (migrationCount > 0) {
      await settingsApi.set('MIGRATION_COMPLETE', 'true');
      await settingsApi.set('MIGRATION_DATE', new Date().toISOString());
      console.log('Migration completed successfully');
      return true;
    } else {
      console.log('No data to migrate');
      return false;
    }
  } catch (err) {
    console.error('Error during migration:', err);
    return false;
  }
}

/**
 * Gets the walletId or creates a new one if not exists
 */
export async function getOrCreateWalletId(): Promise<string> {
  const existingId = await settingsApi.get('WALLET_ID', '');
  if (existingId) {
    return existingId;
  }
  
  const newId = uuidv4();
  await settingsApi.set('WALLET_ID', newId);
  return newId;
} 