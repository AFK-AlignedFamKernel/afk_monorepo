import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { 
  MintData, 
  Token, 
  Transaction, 
  StorageData, 
  initDatabase, 
  settingsApi,
  mintsApi,
  db
} from '@/utils/storage';

export function useCashuStorage() {
  const [walletData, setWalletData] = useState<StorageData>({
    mints: [],
    balance: 0,
    transactions: [],
    tokens: [],
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);

  // Initialize the database
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize the new Dexie database
        const dbInitialized = await initDatabase();
        if (!dbInitialized) {
          throw new Error('Failed to initialize database');
        }
        
        // Load data from the new database
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
        
        // Ensure balance is not negative
        balance = Math.max(0, balance);
        setBalance(balance);
        
        // For compatibility, use empty tokens array
        const tokens: Token[] = [];
        
        // Set the wallet data
        setWalletData({
          mints,
          activeMint,
          activeUnit,
          balance,
          transactions,
          tokens,
        });
        
        setIsInitialized(true);
        setLoading(false);
      } catch (err) {
        setError(typeof err === 'string' ? err : 'Failed to initialize wallet storage');
        setLoading(false);
      }
    };

    init();
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    const saveData = async () => {
      if (isInitialized && !loading) {
        try {
          console.log('Saving wallet data to database...');
          
          // Update mints
          await mintsApi.setAll(walletData.mints);
          
          // Update active mint and unit
          if (walletData.activeMint) {
            await settingsApi.set('ACTIVE_MINT', walletData.activeMint);
          }
          
          if (walletData.activeUnit) {
            await settingsApi.set('ACTIVE_UNIT', walletData.activeUnit);
          }
          
          // Update transactions
          await db.transaction('rw', db.transactions, async () => {
            // This is a simple implementation - in reality you might want to be more selective
            await db.transactions.clear();
            await db.transactions.bulkAdd(walletData.transactions);
          });
          
          console.log('Successfully saved wallet data to database');
        } catch (err) {
          console.error('Failed to save wallet data to database:', err);
          setError(typeof err === 'string' ? err : 'Failed to save wallet data');
        }
      }
    };
    
    saveData();
  }, [walletData, isInitialized, loading]);

  // Add a new mint
  const addMint = useCallback((mintUrl: string, alias: string) => {
    setWalletData(prev => {
      // Don't add if mint URL already exists
      if (prev.mints.some(mint => mint.url === mintUrl)) {
        return prev;
      }

      const newMint: MintData = {
        url: mintUrl,
        alias,
        units: ['sat'],
      };

      const newMints = [...prev.mints, newMint];
      
      // If this is the first mint, set it as active
      const newActiveMint = prev.activeMint || mintUrl;
      const newActiveUnit = prev.activeUnit || 'sat';

      return {
        ...prev,
        mints: newMints,
        activeMint: newActiveMint,
        activeUnit: newActiveUnit,
      };
    });
  }, []);

  // Set active mint
  const setActiveMint = useCallback((mintUrl: string) => {
    setWalletData(prev => {
      // Verify mint exists
      if (!prev.mints.some(mint => mint.url === mintUrl)) {
        return prev;
      }

      return {
        ...prev,
        activeMint: mintUrl,
      };
    });
  }, []);

  // Set active unit
  const setActiveUnit = useCallback((unit: string) => {
    setWalletData(prev => {
      // Verify active mint has this unit
      const activeMint = prev.mints.find(mint => mint.url === prev.activeMint);
      if (!activeMint || !activeMint.units.includes(unit)) {
        return prev;
      }

      return {
        ...prev,
        activeUnit: unit,
      };
    });
  }, []);

  // Update mint keys
  const updateMintKeys = useCallback((mintUrl: string, keys: Record<string, any>) => {
    setWalletData(prev => {
      const mintIndex = prev.mints.findIndex(mint => mint.url === mintUrl);
      if (mintIndex === -1) {
        return prev;
      }

      const updatedMints = [...prev.mints];
      updatedMints[mintIndex] = {
        ...updatedMints[mintIndex],
        keys,
      };

      return {
        ...prev,
        mints: updatedMints,
      };
    });
  }, []);

  // Add a transaction
  const addTransaction = useCallback((
    type: 'sent' | 'received', 
    amount: number, 
    memo?: string, 
    token?: string | null, 
    paymentHash?: string | null, 
    mintUrl?: string,
    status?: 'pending' | 'paid' | 'failed',
    description?: string,
    invoiceType?: 'lightning',
    invoice?: string,
    quote?: string
  ) => {
    setWalletData(prev => {
      const newTransaction: Transaction = {
        id: uuidv4(),
        type,
        amount,
        date: new Date().toISOString(),
        memo: memo || '',
        token: token || undefined,
        paymentHash: paymentHash || undefined,
        mintUrl: mintUrl || prev.activeMint,
        status,
        description,
        invoiceType,
        invoice,
        quote
      };

      // Only update balance for paid transactions or non-lightning transactions
      let balanceChange = 0;
      if (invoiceType !== 'lightning' || status === 'paid') {
        balanceChange = type === 'received' ? amount : -amount;
      }
      
      const newBalance = prev.balance + balanceChange;
      setBalance(newBalance);

      return {
        ...prev,
        transactions: [newTransaction, ...prev.transactions],
        balance: newBalance >= 0 ? newBalance : prev.balance, // Safety check
      };
    });
    
    // Also save directly to the database
    const saveToDb = async (
      type: 'sent' | 'received', 
      amount: number, 
      memo?: string, 
      token?: string | null, 
      paymentHash?: string | null, 
      mintUrl?: string,
      status?: 'pending' | 'paid' | 'failed',
      description?: string,
      invoiceType?: 'lightning',
      invoice?: string,
      quote?: string
    ) => {
      try {
        const newTransaction: Transaction = {
          id: uuidv4(),
          type,
          amount,
          date: new Date().toISOString(),
          memo: memo || '',
          token: token || undefined,
          paymentHash: paymentHash || undefined,
          mintUrl: mintUrl || walletData.activeMint,
          status,
          description,
          invoiceType,
          invoice,
          quote
        };
        
        await db.transactions.add(newTransaction);
      } catch (err) {
        console.error('Error saving transaction to database:', err);
      }
    };
    
    saveToDb(
      type, 
      amount, 
      memo, 
      token, 
      paymentHash, 
      mintUrl, 
      status, 
      description, 
      invoiceType, 
      invoice, 
      quote
    );
  }, [walletData.activeMint]);

  // Add token
  const addToken = useCallback((token: string, amount: number, mintUrl: string) => {
    console.log('Adding token to storage:', { amount, mintUrl });
    
    setWalletData(prev => {
      const newToken: Token = {
        id: uuidv4(),
        token,
        amount,
        mintUrl,
        spendable: true,
        created: new Date().toISOString(),
      };
      
      return {
        ...prev,
        tokens: [...prev.tokens, newToken],
      };
    });
  }, []);

  // Update transaction
  const updateTransaction = useCallback((transactionId: string, updates: Partial<Transaction>) => {
    setWalletData(prev => {
      const transactionIndex = prev.transactions.findIndex(tx => tx.id === transactionId);
      if (transactionIndex === -1) {
        return prev;
      }

      const updatedTransaction = {
        ...prev.transactions[transactionIndex],
        ...updates,
      };

      const updatedTransactions = [...prev.transactions];
      updatedTransactions[transactionIndex] = updatedTransaction;

      // Recalculate balance if status changed
      if ('status' in updates) {
        let balanceChange = 0;
        const tx = prev.transactions[transactionIndex];
        
        // If changing from pending/failed to paid
        if (tx.status !== 'paid' && updates.status === 'paid') {
          balanceChange = tx.type === 'received' ? tx.amount : -tx.amount;
        }
        // If changing from paid to failed/pending
        else if (tx.status === 'paid' && updates.status !== 'paid') {
          balanceChange = tx.type === 'received' ? -tx.amount : tx.amount;
        }
        
        const newBalance = prev.balance + balanceChange;
        
        setBalance(newBalance);
        return {
          ...prev,
          transactions: updatedTransactions,
          balance: newBalance >= 0 ? newBalance : prev.balance, // Safety check
        };
      }

      return {
        ...prev,
        transactions: updatedTransactions,
      };
    });
    
    // Also update in database
    const updateInDb = async (transactionId: string, updates: Partial<Transaction>) => {
      try {
        const tx = await db.transactions.get(transactionId);
        if (tx) {
          const updatedTx = { ...tx, ...updates };
          await db.transactions.put(updatedTx);
        }
      } catch (err) {
        console.error('Error updating transaction in database:', err);
      }
    };
    
    updateInDb(transactionId, updates);
  }, []);

  return {
    walletData,
    setWalletData,
    isInitialized,
    loading,
    error,
    addMint,
    setActiveMint,
    setActiveUnit,
    updateMintKeys,
    addTransaction,
    addToken,
    updateTransaction,
    setBalance,
    balance
  };
} 