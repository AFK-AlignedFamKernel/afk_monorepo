import Dexie from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import * as SQLite from 'expo-sqlite';

// Import models/types
import { MintData, ICashuInvoice } from 'afk_nostr_sdk';
import { MeltQuoteResponse, Proof, Token } from '@cashu/cashu-ts';

// Polyfill for React Native environment
if (!globalThis.indexedDB) {
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    // Initialize SQLite as IndexedDB backend for native platforms
    const sqliteDb = SQLite.openDatabaseSync('cashu_database.db');
    
    // This class would provide a bridge between SQLite and IndexedDB APIs
    // For a full implementation, consider using existing libraries or building a custom adapter
    class SQLiteBackend {
      // Implementation would go here
    }
    
    // Set up the polyfill
    // Note: This is a simplified approach - in production you'd use a full adapter
    globalThis.indexedDB = new SQLiteBackend() as any;
  }
}

// Define an interface for proofs by mint to include the mint URL
export interface ProofWithMint extends Proof {
  mintUrl?: string; // The mint URL this proof is associated with
}

// Define your database
export class CashuDatabase extends Dexie {
  // Define tables
  mints!: Dexie.Table<MintData, string>; // string = type of the primary key
  proofs!: Dexie.Table<Proof, string>;
  proofsSpents!: Dexie.Table<Proof, string>;
  proofsByMint!: Dexie.Table<ProofWithMint, string>; // New table for indexing proofs by mint
  proofsSpentsByMint!: Dexie.Table<ProofWithMint, string>; // New table for indexing proofs by mint
  tokens!: Dexie.Table<Token, string>;
  quotes!: Dexie.Table<MeltQuoteResponse, string>;
  invoices!: Dexie.Table<ICashuInvoice, string>;
  transactions!: Dexie.Table<ICashuInvoice, string>;
  settings!: Dexie.Table<{ key: string; value: string }, string>;

  constructor() {
    super('cashu_database');
    
    // Define the database schema
    this.version(1).stores({
      mints: '&url, alias', // & means primary key
      proofs: '&C, id, amount', // C is the proof identifier
      proofsSpents: '&C, id, amount', // Spent proofs
      proofsByMint: '&C, mintUrl, id, amount', // Indexed by both C and mintUrl
      proofsSpentsByMint: '&C, mintUrl, id, amount', // Indexed by both C and mintUrl
      tokens: '&id, amount',
      quotes: '&id, amount, created_at',
      invoices: '&request, amount, paid, unit, mint, date, state, bolt11, quote, quoteResponse, expiry, id',
      transactions: '&id, created_at, amount, type',
      settings: '&key, value' // For storing active mint, unit, etc.
    });
  }
}

// Create and export a database instance
export const db = new CashuDatabase();

// Helper function to initialize database
export async function initializeDatabase() {
  try {
    // Open the database to ensure it exists and is ready
    await db.open();
    console.log('Database initialized successfully');
    
    // Initialize default settings if needed
    const activeMint = await db.settings.get('ACTIVE_MINT');
    if (!activeMint) {
      await db.settings.put({ key: 'ACTIVE_MINT', value: '' });
    }
    
    const activeUnit = await db.settings.get('ACTIVE_UNIT');
    if (!activeUnit) {
      await db.settings.put({ key: 'ACTIVE_UNIT', value: '' });
    }
    
    const signerType = await db.settings.get('SIGNER_TYPE');
    if (!signerType) {
      await db.settings.put({ key: 'SIGNER_TYPE', value: '' });
    }
    
    const walletId = await db.settings.get('WALLET_ID');
    if (!walletId) {
      await db.settings.put({ key: 'WALLET_ID', value: '' });
    }
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}

// Export useLiveQuery for components to use
export { useLiveQuery }; 