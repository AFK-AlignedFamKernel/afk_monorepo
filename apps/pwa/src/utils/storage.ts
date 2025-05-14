import Dexie from 'dexie';
import { v4 as uuidv4 } from 'uuid';

// Import models/types
import { ICashuInvoice } from 'afk_nostr_sdk';
import { MeltQuoteResponse, Proof, Token as CashuToken } from '@cashu/cashu-ts';

// Define an interface for proofs by mint to include the mint URL
export interface ProofWithMint extends Proof {
  mintUrl?: string; // The mint URL this proof is associated with
}

export interface MintData {
  url: string;
  alias: string;
  units: string[];
  keys?: Record<string, any>;
}

export interface Transaction {
  /** Unique identifier for the transaction */
  id: string;
  /** Type of transaction */
  type: 'sent' | 'received';
  /** Amount in sats */
  amount: number;
  /** ISO date string */
  date: string;
  /** Optional memo for the transaction */
  memo?: string;
  /** Ecash token if applicable */
  token?: string;
  /** Lightning payment hash for tracking invoice status */
  paymentHash?: string;
  /** Mint URL associated with this transaction */
  mintUrl?: string;
  /** Status of the transaction */
  status?: 'pending' | 'paid' | 'failed';
  /** Human-readable description */
  description?: string;
  /** Type of invoice if applicable */
  invoiceType?: 'lightning';
  /** Full Lightning invoice if applicable */
  invoice?: string;
  /** Unit of currency (default: sat) */
  unit?: string;
  /** Mint quote for checking status and claiming proofs */
  quote?: string;
}

export interface Token {
  id: string;
  token: string;
  amount: number;
  mintUrl: string;
  spendable: boolean;
  created: string;
}

// Legacy storage interface for migration
export interface StorageData {
  mints: MintData[];
  activeMint?: string;
  activeUnit?: string;
  balance: number;
  transactions: Transaction[];
  tokens: Token[];
}

// Define our database
class CashuDatabase extends Dexie {
  // Define tables
  mints!: Dexie.Table<MintData, string>; 
  proofs!: Dexie.Table<Proof, string>;
  proofsSpents!: Dexie.Table<Proof, string>;
  proofsByMint!: Dexie.Table<ProofWithMint, string>; 
  proofsSpentsByMint!: Dexie.Table<ProofWithMint, string>; 
  tokens!: Dexie.Table<CashuToken, string>;
  quotes!: Dexie.Table<MeltQuoteResponse, string>;
  invoices!: Dexie.Table<ICashuInvoice, string>;
  transactions!: Dexie.Table<Transaction, string>;
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
      invoices: '&id, amount, paid, unit, mint, date, state, bolt11, quote',
      transactions: '&id, type, amount, date',
      settings: '&key, value' // For storing active mint, unit, etc.
    });
    
    // Version 2: Migrate from the old IndexedDB format to the new structured format
    this.version(2).stores({
      // Same schema, but we'll migrate data
    }).upgrade(async tx => {
      console.log('Migrating data from old format to new Dexie structure');
      
      try {
        // Try to open the old database
        const oldDbRequest = indexedDB.open('cashu-wallet', 1);
        
        oldDbRequest.onsuccess = async (event) => {
          try {
            const oldDb = (event.target as IDBOpenDBRequest).result;
            if (!oldDb.objectStoreNames.contains('wallet')) {
              console.log('Old wallet store not found, skipping migration');
              return;
            }
            
            const oldTx = oldDb.transaction(['wallet'], 'readonly');
            const oldStore = oldTx.objectStore('wallet');
            const getRequest = oldStore.get('wallet-data');
            
            getRequest.onsuccess = async (event) => {
              const oldData = (event.target as IDBRequest).result?.data as StorageData;
              if (!oldData) {
                console.log('No old data found, skipping migration');
                return;
              }
              
              console.log('Found old wallet data, starting migration');
              
              // Migrate mints
              if (oldData.mints?.length > 0) {
                await tx.table('mints').bulkAdd(oldData.mints);
              }
              
              // Migrate active mint and unit
              if (oldData.activeMint) {
                await tx.table('settings').put({ 
                  key: 'ACTIVE_MINT', 
                  value: oldData.activeMint 
                });
              }
              
              if (oldData.activeUnit) {
                await tx.table('settings').put({ 
                  key: 'ACTIVE_UNIT', 
                  value: oldData.activeUnit 
                });
              }
              
              // Migrate transactions
              if (oldData.transactions?.length > 0) {
                await tx.table('transactions').bulkAdd(oldData.transactions);
              }
              
              // Migrate tokens
              if (oldData.tokens?.length > 0) {
                for (const token of oldData.tokens) {
                  try {
                    if (token.token && token.mintUrl) {
                      // For now, we'll keep tokens in the original format
                      await tx.table('tokens').put({
                        id: token.id,
                        mint: token.mintUrl,
                        proofs: [], // This would need to be extracted from the token
                        amount: token.amount,
                      });
                    }
                  } catch (err) {
                    console.error('Error migrating token:', err);
                  }
                }
              }
              
              console.log('Migration completed successfully');
            };
            
            getRequest.onerror = (event) => {
              console.error('Error retrieving old wallet data:', event);
            };
          } catch (err) {
            console.error('Error during migration:', err);
          }
        };
        
        oldDbRequest.onerror = (event) => {
          console.error('Error opening old database:', event);
        };
      } catch (err) {
        console.error('Migration error:', err);
      }
    });
  }
}

// Create and export a database instance
export const db = new CashuDatabase();

// Settings API
export const settingsApi = {
  async get<T extends string>(key: string, defaultValue: T): Promise<T> {
    const result = await db.settings.get(key);
    return (result?.value as T) || defaultValue;
  },

  async set<T extends string>(key: string, value: T): Promise<void> {
    await db.settings.put({ key, value });
  },
};

// Mints API
export const mintsApi = {
  async getAll(): Promise<MintData[]> {
    return db.mints.toArray();
  },

  async getByUrl(url: string): Promise<MintData | undefined> {
    return db.mints.get(url);
  },

  async add(mint: MintData): Promise<string | undefined> {
    try {
      return await db.mints.add(mint) as unknown as string;
    } catch (error) {
      console.error('Error adding mint:', error);
      return undefined;
    }
  },

  async update(mint: MintData): Promise<void> {
    try {
      await db.mints.put(mint);
    } catch (error) {
      console.error('Error updating mint:', error);
    }
  },

  async delete(url: string): Promise<void> {
    try {
      await db.mints.delete(url);
    } catch (error) {
      console.error('Error deleting mint:', error);
    }
  },

  async setAll(mints: MintData[]): Promise<void> {
    try {
      await db.transaction('rw', db.mints, async () => {
        await db.mints.clear();
        await db.mints.bulkAdd(mints);
      });
    } catch (error) {
      console.error('Error setting all mints:', error);
    }
  },
};

// Proofs API
export const proofsApi = {
  async getAll(): Promise<Proof[]> {
    return db.proofs.toArray();
  },

  async get(id: string): Promise<Proof | undefined> {
    return db.proofs.get(id);
  },

  async add(proof: Proof): Promise<string> {
    try {
      return await db.proofs.add(proof) as unknown as string;
    } catch (error) {
      console.error('Error adding proof:', error);
      throw error;
    }
  },

  async update(proof: Proof): Promise<void> {
    try {
      await db.proofs.put(proof);
    } catch (error) {
      console.error('Error updating proof:', error);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await db.proofs.delete(id);
    } catch (error) {
      console.error('Error deleting proof:', error);
    }
  },

  async setAll(proofs: Proof[]): Promise<void> {
    try {
      await db.transaction('rw', db.proofs, async () => {
        await db.proofs.clear();
        await db.proofs.bulkAdd(proofs);
      });
    } catch (error) {
      console.error('Error setting all proofs:', error);
    }
  },
};

// ProofsByMint API
export const proofsByMintApi = {
  async getAll(): Promise<ProofWithMint[]> {
    return db.proofsByMint.toArray();
  },

  async get(id: string): Promise<ProofWithMint | undefined> {
    return db.proofsByMint.get(id);
  },

  async add(proof: Proof, mintUrl: string): Promise<string | undefined> {
    const proofWithMint: ProofWithMint = { ...proof, mintUrl };
    try {
      return await db.proofsByMint.add(proofWithMint) as unknown as string;
    } catch (error) {
      console.error('Error adding proof by mint:', error);
      return undefined;
    }
  },

  async update(proofWithMint: ProofWithMint): Promise<void> {
    try {
      await db.proofsByMint.put(proofWithMint);
    } catch (error) {
      console.error('Error updating proof by mint:', error);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await db.proofsByMint.delete(id);
    } catch (error) {
      console.error('Error deleting proof by mint:', error);
    }
  },

  async getByMintUrl(mintUrl: string): Promise<ProofWithMint[]> {
    return db.proofsByMint.where('mintUrl').equals(mintUrl).toArray();
  },

  async addProofsForMint(proofs: Proof[], mintUrl: string): Promise<void> {
    try {
      const proofsWithMint: ProofWithMint[] = proofs.map(proof => ({
        ...proof,
        mintUrl
      }));

      await db.transaction('rw', db.proofsByMint, async () => {
        for (const proof of proofsWithMint) {
          await db.proofsByMint.put(proof);
        }
      });
    } catch (error) {
      console.error('Error adding proofs for mint:', error);
    }
  },

  async setAllForMint(proofs: Proof[], mintUrl: string): Promise<void> {
    try {
      await db.transaction('rw', db.proofsByMint, async () => {
        // Delete all proofs for this mint
        await db.proofsByMint.where('mintUrl').equals(mintUrl).delete();
        
        // Add the new proofs
        const proofsWithMint = proofs.map(proof => ({ ...proof, mintUrl }));
        await db.proofsByMint.bulkAdd(proofsWithMint);
      });
    } catch (error) {
      console.error('Error setting all proofs for mint:', error);
    }
  },
};

// Proofs Spents API
export const proofsSpentsApi = {
  async getAll(): Promise<Proof[]> {
    return db.proofsSpents.toArray();
  },

  async get(id: string): Promise<Proof | undefined> {
    return db.proofsSpents.get(id);
  },

  async add(proof: Proof): Promise<string> {
    return await db.proofsSpents.add(proof) as unknown as string;
  },

  async update(proof: Proof): Promise<void> {
    await db.proofsSpents.put(proof);
  },

  async updateMany(proofs: Proof[]): Promise<void> {
    try {
      await db.transaction('rw', db.proofsSpents, async () => {
        await db.proofsSpents.bulkPut(proofs);
      });
    } catch (error) {
      console.error('Error updating spent proofs:', error);
    }
  },
};

// ProofsSpentsByMint API
export const proofsSpentsByMintApi = {
  async getByMintUrl(mintUrl: string): Promise<ProofWithMint[]> {
    return db.proofsSpentsByMint.where('mintUrl').equals(mintUrl).toArray();
  },

  async addProofsForMint(proofs: Proof[], mintUrl: string): Promise<void> {
    try {
      const proofsWithMint: ProofWithMint[] = proofs.map(proof => ({
        ...proof,
        mintUrl
      }));

      await db.transaction('rw', db.proofsSpentsByMint, async () => {
        for (const proof of proofsWithMint) {
          await db.proofsSpentsByMint.put(proof);
        }
      });
    } catch (error) {
      console.error('Error adding spent proofs for mint:', error);
    }
  },
};

// Invoices API
export const invoicesApi = {
  async getAll(): Promise<ICashuInvoice[]> {
    return db.invoices.toArray();
  },

  async get(id: string): Promise<ICashuInvoice | undefined> {
    return db.invoices.get(id);
  },

  async add(invoice: ICashuInvoice): Promise<string | undefined> {
    try {
      return await db.invoices.add(invoice) as unknown as string;
    } catch (error) {
      console.error('Error adding invoice:', error);
      return undefined;
    }
  },

  async update(invoice: ICashuInvoice): Promise<void> {
    try {
      // Ensure we have an ID for the primary key
      if (!invoice.id) {
        console.error('Cannot update invoice: Missing ID field');
        return;
      }
      await db.invoices.put(invoice);
    } catch (error) {
      console.error('Error updating invoice:', error);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await db.invoices.delete(id);
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  },

  async setAll(invoices: ICashuInvoice[]): Promise<void> {
    try {
      await db.transaction('rw', db.invoices, async () => {
        await db.invoices.clear();
        await db.invoices.bulkAdd(invoices);
      });
    } catch (error) {
      console.error('Error setting all invoices:', error);
    }
  }
};

// Helper function to initialize database
export async function initDatabase() {
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
      await db.settings.put({ key: 'ACTIVE_UNIT', value: 'sat' });
    }
    
    const walletId = await db.settings.get('WALLET_ID');
    if (!walletId) {
      await db.settings.put({ key: 'WALLET_ID', value: uuidv4() });
    }
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}

// Legacy functions for backward compatibility
export const getWalletData = async (): Promise<StorageData> => {
  // This will start fetching from the new Dexie DB
  const mints = await mintsApi.getAll();
  const activeMint = await settingsApi.get('ACTIVE_MINT', '');
  const activeUnit = await settingsApi.get('ACTIVE_UNIT', 'sat');
  const transactions = await db.transactions.toArray();
  
  // Calculate balance from transactions
  let balance = 0;
  transactions.forEach(tx => {
    if (tx.status === 'paid' || tx.status === undefined) {
      balance += tx.type === 'received' ? tx.amount : -tx.amount;
    }
  });
  
  // For compatibility, return token array
  const tokens: Token[] = [];
  
  return {
    mints,
    activeMint,
    activeUnit,
    balance: Math.max(0, balance), // Ensure balance is not negative
    transactions,
    tokens,
  };
};

export const saveWalletData = async (data: StorageData): Promise<void> => {
  // Instead of the old method, we'll save to the new DB structure
  await mintsApi.setAll(data.mints);
  
  if (data.activeMint) {
    await settingsApi.set('ACTIVE_MINT', data.activeMint);
  }
  
  if (data.activeUnit) {
    await settingsApi.set('ACTIVE_UNIT', data.activeUnit);
  }
  
  // For transactions, we'll update them
  await db.transaction('rw', db.transactions, async () => {
    await db.transactions.clear();
    await db.transactions.bulkAdd(data.transactions);
  });
}; 