import { MintData, ICashuInvoice } from 'afk_nostr_sdk';
import { MeltQuoteResponse, Proof, Token } from '@cashu/cashu-ts';
import { db, ProofWithMint } from './db';

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
  
  async add(mint: MintData): Promise<string|undefined> {
    try {
      return db.mints.add(mint) as unknown as string;
    } catch (error) {
      console.error('Error adding mints:', error);
      return undefined;
    }
  },
  
  async update(mint: MintData): Promise<void> {
    try {
      await db.mints.put(mint);
    } catch (error) {
      console.error('Error updating mints:', error);
    }
  },
  
  async delete(url: string): Promise<void> {
    try {
      await db.mints.delete(url);
    } catch (error) {
      console.error('Error deleting mints:', error);
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
      return db.proofs.add(proof) as unknown as string;
    } catch (error) {
      console.error('Error adding proofs:', error);
    }
  },
  
  async update(proof: Proof): Promise<void> { 
    try {
      await db.proofs.put(proof);
    } catch (error) {
      console.error('Error updating proofs:', error);
    }
  },
  
  async delete(id: string): Promise<void> {
    try {
      await db.proofs.delete(id);
    } catch (error) {
      console.error('Error deleting proofs:', error);
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
  
  async deleteMany(ids: string[]): Promise<void> {
    try {
      await db.proofs.bulkDelete(ids);
    } catch (error) {
      console.error('Error deleting proofs:', error);
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
    return db.proofsSpents.add(proof) as unknown as string;
  },
  
  async update(proof: Proof): Promise<void> {
    await db.proofsSpents.put(proof);
  },
  
  async delete(id: string): Promise<void> {
    try {
      await db.proofsSpents.delete(id);
    } catch (error) {
      console.error('Error deleting proofsSpents:', error);
    }
  },
  
  async setAll(proofs: Proof[]): Promise<void> {
    try {
      await db.transaction('rw', db.proofsSpents, async () => {
        await db.proofsSpents.clear();
        await db.proofsSpents.bulkAdd(proofs);
      });
    } catch (error) {
      console.error('Error setting all proofsSpents:', error);
    }
  },
  
  async updateMany(proofs: Proof[]): Promise<void> {
    try {
      await db.transaction('rw', db.proofsSpents, async () => {
        await db.proofsSpents.bulkPut(proofs);
      });
    } catch (error) {
      console.error('Error updating proofsSpents:', error);
    }
  },
  
  async deleteMany(ids: string[]): Promise<void> {
    await db.proofsSpents.bulkDelete(ids);
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
  
  async add(proof: Proof, mintUrl: string): Promise<string|undefined> {
    const proofWithMint: ProofWithMint = { ...proof, mintUrl };
    try {
      return db.proofsByMint.add(proofWithMint) as unknown as string;
    } catch (error) {
      console.error('Error adding proofsByMint:', error);
      return undefined;
    }
  },
  
  async update(proofWithMint: ProofWithMint): Promise<void> {
    try {
      await db.proofsByMint.put(proofWithMint);
    } catch (error) {
      console.error('Error updating proofsByMint:', error);
    }
  },
  
  async delete(id: string): Promise<void> {
    try {
      await db.proofsByMint.delete(id);
    } catch (error) {
      console.error('Error deleting proofsByMint:', error);
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
  
  async deleteAllForMint(mintUrl: string): Promise<void> {
    try {
      await db.proofsByMint.where('mintUrl').equals(mintUrl).delete();
    } catch (error) {
      console.error('Error deleting all proofs for mint:', error);
    }
  },
  
  async setAllForMint(proofs: Proof[], mintUrl: string): Promise<void> {
    try {
      const proofsWithMint: ProofWithMint[] = proofs.map(proof => ({ 
        ...proof, 
        mintUrl 
    }));
    
    await db.transaction('rw', db.proofsByMint, async () => {
      await db.proofsByMint.where('mintUrl').equals(mintUrl).delete();
        await db.proofsByMint.bulkAdd(proofsWithMint);
      });
    } catch (error) {
      console.error('Error setting all proofsByMint for mint:', error);
    }
  },
  
  async bulkAddOrUpdate(proofsWithMint: ProofWithMint[]): Promise<void> {
    try {
      await db.transaction('rw', db.proofsByMint, async () => {
        await db.proofsByMint.bulkPut(proofsWithMint);
      });
    } catch (error) {
      console.error('Error bulk adding or updating proofsByMint:', error);
    }
  },
  
  async deleteMany(ids: string[]): Promise<void> {
    await db.proofsByMint.bulkDelete(ids);
  },
  
  async syncWithProofs(proofs: Proof[], mintUrl: string): Promise<void> {
    try {
      // This method both adds new proofs and removes stale ones
      // to keep proofsByMint in sync with the proofs table
      const proofsWithMint: ProofWithMint[] = proofs.map(proof => ({ 
      ...proof, 
      mintUrl 
    }));
    
    await db.transaction('rw', db.proofsByMint, async () => {
      // Delete all proofs for this mint
      await db.proofsByMint.where('mintUrl').equals(mintUrl).delete();
      
      // Add the current proofs
        await db.proofsByMint.bulkAdd(proofsWithMint);
      });
    } catch (error) {
      console.error('Error syncing proofsByMint:', error);
    }
  }
};

// Tokens API
export const tokensApi = {
  async getAll(): Promise<Token[]> {
    return db.tokens.toArray();
  },
  
  async get(id: string): Promise<Token | undefined> {
    return db.tokens.get(id);
  },
  
  async add(token: Token): Promise<string> {
    return db.tokens.add(token) as unknown as string;
  },
  
  async update(token: Token): Promise<void> {
    await db.tokens.put(token);
  },
  
  async delete(id: string): Promise<void> {
    await db.tokens.delete(id);
  },
  
  async setAll(tokens: Token[]): Promise<void> {
    await db.transaction('rw', db.tokens, async () => {
      await db.tokens.clear();
      await db.tokens.bulkAdd(tokens);
    });
  },
};

// Quotes API
export const quotesApi = {
  async getAll(): Promise<MeltQuoteResponse[]> {
    return db.quotes.toArray();
  },
  
  async get(id: string): Promise<MeltQuoteResponse | undefined> {
    return db.quotes.get(id);
  },
  
  async add(quote: MeltQuoteResponse): Promise<string> {
    return db.quotes.add(quote) as unknown as string;
  },
  
  async update(quote: MeltQuoteResponse): Promise<void> {
    await db.quotes.put(quote);
  },
  
  async delete(id: string): Promise<void> {
    await db.quotes.delete(id);
  },
  
  async setAll(quotes: MeltQuoteResponse[]): Promise<void> {
    await db.transaction('rw', db.quotes, async () => {
      await db.quotes.clear();
      await db.quotes.bulkAdd(quotes);
    });
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
  
  async add(invoice: ICashuInvoice): Promise<string> {
    return db.invoices.add(invoice) as unknown as string;
  },
  
  async update(invoice: ICashuInvoice): Promise<void> {
    await db.invoices.put(invoice);
  },
  
  async delete(id: string): Promise<void> {
    await db.invoices.delete(id);
  },
  
  async setAll(invoices: ICashuInvoice[]): Promise<void> {
    await db.transaction('rw', db.invoices, async () => {
      await db.invoices.clear();
      await db.invoices.bulkAdd(invoices);
    });
  },
};

// Transactions API
export const transactionsApi = {
  async getAll(): Promise<ICashuInvoice[]> {
    return db.transactions.toArray();
  },
  
  async get(id: string): Promise<ICashuInvoice | undefined> {
    return db.transactions.get(id);
  },
  
  async add(transaction: ICashuInvoice): Promise<string> {
    return db.transactions.add(transaction) as unknown as string;
  },
  
  async update(transaction: ICashuInvoice): Promise<void> {
    await db.transactions.put(transaction);
  },
  
  async delete(id: string): Promise<void> {
    await db.transactions.delete(id);
  },
  
  async setAll(transactions: ICashuInvoice[]): Promise<void> {
    await db.transaction('rw', db.transactions, async () => {
      await db.transactions.clear();
      await db.transactions.bulkAdd(transactions);
    });
  },
}; 


// ProofsByMint API
export const proofsSpentsByMintApi = {
  async getAll(): Promise<ProofWithMint[]> {
    return db.proofsSpentsByMint.toArray();
  },
  
  async get(id: string): Promise<ProofWithMint | undefined> {
    return db.proofsSpentsByMint.get(id);
  },
  
  async add(proof: Proof, mintUrl: string): Promise<string> {
    const proofWithMint: ProofWithMint = { ...proof, mintUrl };
    return db.proofsSpentsByMint.add(proofWithMint) as unknown as string;
  },
  
  async update(proofWithMint: ProofWithMint): Promise<void> {
    await db.proofsSpentsByMint.put(proofWithMint);
  },
  
  async delete(id: string): Promise<void> {
    await db.proofsSpentsByMint.delete(id);
  },
  
  async getByMintUrl(mintUrl: string): Promise<ProofWithMint[]> {
    return db.proofsSpentsByMint.where('mintUrl').equals(mintUrl).toArray();
  },
  
  async addProofsForMint(proofs: Proof[], mintUrl: string): Promise<void> {
    const proofsWithMint: ProofWithMint[] = proofs.map(proof => ({ 
      ...proof, 
      mintUrl 
    }));
    
    await db.transaction('rw', db.proofsSpentsByMint, async () => {
      for (const proof of proofsWithMint) {
        await db.proofsSpentsByMint.put(proof);
      }
    });
  },
  
  async deleteAllForMint(mintUrl: string): Promise<void> {
    await db.proofsSpentsByMint.where('mintUrl').equals(mintUrl).delete();
  },
  
  async setAllForMint(proofs: Proof[], mintUrl: string): Promise<void> {
    const proofsWithMint: ProofWithMint[] = proofs.map(proof => ({ 
      ...proof, 
      mintUrl 
    }));
    
    await db.transaction('rw', db.proofsByMint, async () => {
      await db.proofsSpentsByMint.where('mintUrl').equals(mintUrl).delete();
      await db.proofsSpentsByMint.bulkAdd(proofsWithMint);
    });
  },
  
  async bulkAddOrUpdate(proofsWithMint: ProofWithMint[]): Promise<void> {
    await db.transaction('rw', db.proofsByMint, async () => {
      await db.proofsSpentsByMint.bulkPut(proofsWithMint);
    });
  },
  
  async deleteMany(ids: string[]): Promise<void> {
    await db.proofsSpentsByMint.bulkDelete(ids);
  },
  
  async syncWithProofs(proofs: Proof[], mintUrl: string): Promise<void> {
    // This method both adds new proofs and removes stale ones
    // to keep proofsByMint in sync with the proofs table
    const proofsWithMint: ProofWithMint[] = proofs.map(proof => ({ 
      ...proof, 
      mintUrl 
    }));
    
    await db.transaction('rw', db.proofsSpentsByMint, async () => {
      // Delete all proofs for this mint
      await db.proofsSpentsByMint.where('mintUrl').equals(mintUrl).delete();
      
      // Add the current proofs
      await db.proofsSpentsByMint.bulkAdd(proofsWithMint);
    });
  }
};
