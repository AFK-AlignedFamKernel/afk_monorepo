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
      console.log('Saving updated wallet data to IndexDB. State change detected.');
      console.log('Tokens in wallet data before saving:', walletData.tokens.length);
      
      saveWalletData(walletData).then(() => {
        console.log('Successfully saved wallet data to IndexDB');
        console.log('Tokens saved:', walletData.tokens.length);
      }).catch(err => {
        console.error('Failed to save wallet data to IndexDB:', err);
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
  const addTransaction = useCallback((
    type: 'sent' | 'received', 
    amount: number, 
    memo?: string, 
    token?: string,
    paymentHash?: string,
    mintUrl?: string,
    status?: 'pending' | 'paid' | 'failed',
    description?: string,
    invoiceType?: 'lightning',
    invoice?: string
  ) => {
    setWalletData(prev => {
      const newTransaction: Transaction = {
        id: uuidv4(),
        type,
        amount,
        date: new Date().toISOString(),
        memo,
        token,
        paymentHash,
        mintUrl,
        status,
        description,
        invoiceType,
        invoice
      };

      // Only update balance for paid transactions or non-lightning transactions
      let balanceChange = 0;
      if (invoiceType !== 'lightning' || status === 'paid') {
        balanceChange = type === 'received' ? amount : -amount;
      }
      
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
    console.log('addToken called with:', { 
      tokenStart: token.substring(0, 50) + '...', 
      amount, 
      mintUrl 
    });
    
    setWalletData(prev => {
      console.log('Previous wallet data tokens:', prev.tokens.length);
      
      const newToken: Token = {
        id: uuidv4(),
        token,
        amount,
        mintUrl,
        spendable: true,
        created: new Date().toISOString(),
      };
      
      console.log('Created new token with ID:', newToken.id);
      
      const updatedTokens = [...prev.tokens, newToken];
      console.log('New tokens count:', updatedTokens.length);
      
      return {
        ...prev,
        tokens: updatedTokens,
      };
    });
    
    console.log('addToken: State update scheduled');
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

  // Debug function to check IndexDB token storage
  const debugCheckStorage = useCallback(async () => {
    try {
      console.log('Debug: Performing deep check of token storage');
      // Get current data from IndexDB directly
      const currentData = await getWalletData();
      console.log('Current IndexDB data:', currentData);
      console.log('Tokens in IndexDB:', currentData.tokens?.length || 0);
      console.log('Tokens in state:', walletData.tokens?.length || 0);
      
      // Check if tokens are different between state and storage
      if (JSON.stringify(currentData.tokens) !== JSON.stringify(walletData.tokens)) {
        console.log('Warning: Token state and storage are different!');
        
        // Show details about tokens
        console.log('IndexDB Tokens:', currentData.tokens);
        console.log('State Tokens:', walletData.tokens);
        
        // Decide which has more tokens and use that
        if ((currentData.tokens?.length || 0) > (walletData.tokens?.length || 0)) {
          console.log('IndexDB has more tokens, updating state to match IndexDB');
          setWalletData(prev => ({
            ...prev,
            tokens: currentData.tokens || [],
          }));
        } else {
          console.log('State has more tokens, forcing IndexDB update');
          await saveWalletData(walletData);
        }
      } else {
        console.log('Good: Token state and storage are in sync');
      }
      
      return {
        indexDbCount: currentData.tokens?.length || 0,
        stateCount: walletData.tokens?.length || 0,
        inSync: JSON.stringify(currentData.tokens) === JSON.stringify(walletData.tokens),
      };
    } catch (err) {
      console.error('Error in debugCheckStorage:', err);
      return {
        error: err instanceof Error ? err.message : 'Unknown error',
        indexDbCount: -1,
        stateCount: walletData.tokens?.length || 0,
        inSync: false,
      };
    }
  }, [walletData]);
  
  // Direct token save utility
  const saveTokenDirectly = useCallback(async (token: string, amount: number, mintUrl: string) => {
    try {
      console.log('Directly saving token to IndexDB');
      
      // Get current data from IndexDB
      const currentData = await getWalletData();
      
      // Create new token
      const newToken: Token = {
        id: uuidv4(),
        token,
        amount,
        mintUrl,
        spendable: true,
        created: new Date().toISOString(),
      };
      
      // Add token to data
      const updatedData = {
        ...currentData,
        tokens: [...(currentData.tokens || []), newToken],
      };
      
      // Save updated data directly to IndexDB
      await saveWalletData(updatedData);
      console.log('Token directly saved to IndexDB');
      
      // Also update state to keep in sync
      setWalletData(prev => ({
        ...prev,
        tokens: [...prev.tokens, newToken],
      }));
      
      return {
        success: true,
        tokenId: newToken.id,
      };
    } catch (err) {
      console.error('Error saving token directly:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
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
    // Debug utilities
    debugCheckStorage,
    saveTokenDirectly,
  };
} 