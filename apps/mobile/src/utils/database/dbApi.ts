import { MintData, ICashuInvoice } from 'afk_nostr_sdk';
import { MeltQuoteResponse, Proof, Token } from '@cashu/cashu-ts';
import { db } from './db';

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
  
  async add(mint: MintData): Promise<string> {
    // Dexie will return the primary key of the added item
    return db.mints.add(mint) as unknown as string;
  },
  
  async update(mint: MintData): Promise<void> {
    await db.mints.put(mint);
  },
  
  async delete(url: string): Promise<void> {
    await db.mints.delete(url);
  },
  
  async setAll(mints: MintData[]): Promise<void> {
    await db.transaction('rw', db.mints, async () => {
      await db.mints.clear();
      await db.mints.bulkAdd(mints);
    });
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
    return db.proofs.add(proof) as unknown as string;
  },
  
  async update(proof: Proof): Promise<void> {
    await db.proofs.put(proof);
  },
  
  async delete(id: string): Promise<void> {
    await db.proofs.delete(id);
  },
  
  async setAll(proofs: Proof[]): Promise<void> {
    await db.transaction('rw', db.proofs, async () => {
      await db.proofs.clear();
      await db.proofs.bulkAdd(proofs);
    });
  },
  
  async deleteMany(ids: string[]): Promise<void> {
    await db.proofs.bulkDelete(ids);
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
    await db.proofsSpents.delete(id);
  },
  
  async setAll(proofs: Proof[]): Promise<void> {
    await db.transaction('rw', db.proofsSpents, async () => {
      await db.proofsSpents.clear();
      await db.proofsSpents.bulkAdd(proofs);
    });
  },
    
  async updateMany(proofs: Proof[]): Promise<void> {
    await db.transaction('rw', db.proofsSpents, async () => {
      await db.proofsSpents.bulkPut(proofs);
    });
  },
  
  async deleteMany(ids: string[]): Promise<void> {
    await db.proofsSpents.bulkDelete(ids);
  },
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