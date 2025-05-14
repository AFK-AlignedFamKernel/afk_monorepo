import { useState, useEffect, useCallback } from 'react';
import { 
  initDatabase, 
  getWalletData, 
  saveWalletData, 
  StorageData, 
  MintData, 
  Transaction,
  Token
} from '@/utils/storage';
import { v4 as uuidv4 } from 'uuid';

export function useCashuStorage() {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [walletData, setWalletData] = useState<StorageData>({
    mints: [],
    balance: 0,
    transactions: [],
    tokens: [],
  });
  const [error, setError] = useState<string | null>(null);

  // Initialize the database
  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        const data = await getWalletData();
        setWalletData(data);
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
    if (isInitialized && !loading) {
      saveWalletData(walletData).catch(err => {
        setError(typeof err === 'string' ? err : 'Failed to save wallet data');
      });
    }
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

      const updatedData = {
        ...prev,
        activeMint: mintUrl,
      };
      
      // Immediately save to IndexDB
      saveWalletData(updatedData).catch(err => {
        setError(typeof err === 'string' ? err : 'Failed to save wallet data');
      });
      
      return updatedData;
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
  const addTransaction = useCallback((type: 'sent' | 'received', amount: number, memo?: string, token?: string) => {
    setWalletData(prev => {
      const newTransaction: Transaction = {
        id: uuidv4(),
        type,
        amount,
        date: new Date().toISOString(),
        memo,
        token,
      };

      // Update balance
      const balanceChange = type === 'received' ? amount : -amount;
      const newBalance = prev.balance + balanceChange;

      return {
        ...prev,
        transactions: [newTransaction, ...prev.transactions],
        balance: newBalance >= 0 ? newBalance : prev.balance, // Safety check
      };
    });
  }, []);

  // Add token
  const addToken = useCallback((token: string, amount: number, mintUrl: string) => {
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

  // Mark token as spent
  const markTokenAsSpent = useCallback((tokenId: string) => {
    setWalletData(prev => {
      const tokenIndex = prev.tokens.findIndex(token => token.id === tokenId);
      if (tokenIndex === -1) {
        return prev;
      }

      const updatedTokens = [...prev.tokens];
      updatedTokens[tokenIndex] = {
        ...updatedTokens[tokenIndex],
        spendable: false,
      };

      return {
        ...prev,
        tokens: updatedTokens,
      };
    });
  }, []);

  // Clear all data (for testing)
  const clearAllData = useCallback(() => {
    setWalletData({
      mints: [],
      balance: 0,
      transactions: [],
      tokens: [],
    });
  }, []);

  return {
    loading,
    error,
    walletData,
    addMint,
    setActiveMint,
    setActiveUnit,
    updateMintKeys,
    addTransaction,
    addToken,
    markTokenAsSpent,
    clearAllData,
  };
} 