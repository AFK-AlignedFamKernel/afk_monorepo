import { useCallback, useEffect, useState } from 'react';
import { 
  useCashu as useSDKCashu, 
  useCashuStore, 
  ICashu,
  useCreateWalletEvent,
  useGetCashuTokenEvents,
  useCreateTokenEvent,
  useDeleteTokenEvents,
  MintData
} from 'afk_nostr_sdk';
import { v4 as uuidv4 } from 'uuid';
import { useCashuStorage } from './useCashuStorage';

export function useCashu() {
  // SDK hooks
  const sdkCashu = useSDKCashu();
  const { seed, setSeed } = useCashuStore();
  const { mutateAsync: createWalletEvent } = useCreateWalletEvent();
  const { mutateAsync: createToken } = useCreateTokenEvent();
  const { data: tokensEvents } = useGetCashuTokenEvents();
  const { mutateAsync: deleteTokens } = useDeleteTokenEvents();
  
  // Local storage
  const {
    loading: storageLoading,
    error: storageError,
    walletData,
    addMint: addMintToStorage,
    setActiveMint: setActiveMintInStorage,
    setActiveUnit: setActiveUnitInStorage,
    updateMintKeys,
    addTransaction,
    addToken,
    markTokenAsSpent,
  } = useCashuStorage();

  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wait for storage to be ready
  useEffect(() => {
    if (!storageLoading) {
      if (storageError) {
        setError(storageError);
      } else {
        setIsInitialized(true);
      }
      setLoading(false);
    }
  }, [storageLoading, storageError]);

  // Add a mint with the SDK
  const addMint = useCallback(async (mintUrl: string, alias: string) => {
    try {
      // Use SDK to connect to mint
      const { mint } = await sdkCashu.connectCashMint(mintUrl);
      
      // Save to local storage
      addMintToStorage(mintUrl, alias);
      
      // Initialize wallet if this is the first mint
      if (walletData.mints.length === 0) {
        const id = uuidv4();
        
        // Create wallet event on Nostr if we have a seed
        if (seed) {
          try {
            await createWalletEvent({
              name: id,
              mints: [mintUrl],
              // Convert seed to hex string if needed
              privkey: typeof seed === 'string' ? seed : Buffer.from(seed).toString('hex'),
            });
          } catch (err) {
            console.error('Error creating wallet event:', err);
          }
        }
      }
      
      return {
        url: mintUrl,
        alias,
        units: ['sat'], // Default unit
      };
    } catch (err) {
      console.error('Error adding mint:', err);
      setError(err instanceof Error ? err.message : 'Failed to add mint');
      throw err;
    }
  }, [sdkCashu, addMintToStorage, walletData.mints.length, seed, createWalletEvent]);

  // Set active mint
  const setActiveMint = useCallback((mintUrl: string) => {
    setActiveMintInStorage(mintUrl);
  }, [setActiveMintInStorage]);

  // Set active unit
  const setActiveUnit = useCallback((unit: string) => {
    setActiveUnitInStorage(unit);
  }, [setActiveUnitInStorage]);

  // Get balance for the active mint/unit
  const getBalance = useCallback(async () => {
    if (!isInitialized || !walletData.activeMint || !walletData.activeUnit) {
      return walletData.balance;
    }
    
    try {
      // For now, return the stored balance
      // In a full implementation, we would calculate the real balance from proofs
      return walletData.balance;
    } catch (err) {
      console.error('Error getting balance:', err);
      return walletData.balance;
    }
  }, [isInitialized, walletData.activeMint, walletData.activeUnit, walletData.balance]);

  // Create a Lightning invoice
  const createInvoice = useCallback(async (mintUrl: string, amount: number) => {
    if (!isInitialized) throw new Error('Cashu not initialized');

    try {
      // Connect to mint
      await sdkCashu.connectCashMint(mintUrl);
      
      // Request mint quote
      const { request } = await sdkCashu.requestMintQuote(amount);
      
      // For compatibility with different mint quote response formats
      // Use type assertion to handle potential additional properties
      const mintRequest = request as any;
      const invoice = mintRequest.pr || mintRequest.payment_request || '';
      const paymentHash = mintRequest.hash || mintRequest.payment_hash || '';
      
      return {
        invoice,
        paymentHash,
        amount,
        quote: request,
      };
    } catch (err) {
      console.error('Error creating invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
      throw err;
    }
  }, [isInitialized, sdkCashu]);

  // Check invoice status
  const checkInvoiceStatus = useCallback(async (mintUrl: string, paymentHash: string) => {
    if (!isInitialized) throw new Error('Cashu not initialized');

    try {
      // In a real implementation, we would check with the mint
      // This is a simplified mock response
      return {
        paid: true,
        amount: 100,
        paymentHash,
      };
    } catch (err) {
      console.error('Error checking invoice status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check invoice status');
      throw err;
    }
  }, [isInitialized]);

  // Mint tokens after invoice is paid
  const mintTokens = useCallback(async (mintUrl: string, paymentHash: string) => {
    if (!isInitialized) throw new Error('Cashu not initialized');

    try {
      // Check status (mock)
      const status = await checkInvoiceStatus(mintUrl, paymentHash);
      
      if (!status.paid) {
        throw new Error('Invoice not paid yet');
      }
      
      // Record transaction
      const amount = status.amount;
      addTransaction('received', amount, 'Lightning payment', null);
      
      return {
        success: true,
        amount,
      };
    } catch (err) {
      console.error('Error minting tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to mint tokens');
      throw err;
    }
  }, [isInitialized, checkInvoiceStatus, addTransaction]);

  // Parse token
  const parseToken = useCallback((token: string) => {
    try {
      if (!token.startsWith('cashu')) {
        throw new Error('Invalid token format');
      }
      
      // Mock token parsing
      return {
        valid: true,
        amount: 100, // Mock amount
        mintUrl: walletData.activeMint || '',
        token,
      };
    } catch (err) {
      console.error('Error parsing token:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse token');
      throw err;
    }
  }, [walletData.activeMint]);

  // Receive token
  const receiveToken = useCallback(async (token: string) => {
    if (!isInitialized) throw new Error('Cashu not initialized');

    try {
      const parsed = parseToken(token);
      
      if (!parsed.valid) {
        throw new Error('Invalid token');
      }
      
      // Record the transaction and token
      addTransaction('received', parsed.amount, 'Ecash token', token);
      addToken(token, parsed.amount, parsed.mintUrl);
      
      return {
        success: true,
        amount: parsed.amount,
      };
    } catch (err) {
      console.error('Error receiving token:', err);
      setError(err instanceof Error ? err.message : 'Failed to receive token');
      throw err;
    }
  }, [isInitialized, parseToken, addTransaction, addToken]);

  // Send tokens (create a token for sending)
  const createSendToken = useCallback(async (amount: number) => {
    if (!isInitialized) throw new Error('Cashu not initialized');
    if (!walletData.activeMint) throw new Error('No active mint selected');
    
    try {
      if (amount > walletData.balance) {
        throw new Error('Insufficient balance');
      }
      
      // Mock token generation
      const mockToken = `cashu${Math.random().toString(36).substring(2, 15)}`;
      
      // Record the transaction
      addTransaction('sent', amount, 'Created send token', mockToken);
      
      return {
        success: true,
        token: mockToken,
        amount,
      };
    } catch (err) {
      console.error('Error creating send token:', err);
      setError(err instanceof Error ? err.message : 'Failed to create send token');
      throw err;
    }
  }, [isInitialized, walletData.activeMint, walletData.balance, addTransaction]);

  // Pay a Lightning invoice
  const payLightningInvoice = useCallback(async (invoice: string) => {
    if (!isInitialized) throw new Error('Cashu not initialized');
    if (!walletData.activeMint) throw new Error('No active mint selected');
    
    try {
      // Mock payment
      const amount = 100; // Mock amount
      
      if (amount > walletData.balance) {
        throw new Error('Insufficient balance');
      }
      
      // Record transaction
      addTransaction(
        'sent', 
        amount, 
        `Lightning invoice: ${invoice.substring(0, 10)}...`, 
        null
      );
      
      return {
        success: true,
        amount,
      };
    } catch (err) {
      console.error('Error paying Lightning invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to pay Lightning invoice');
      throw err;
    }
  }, [isInitialized, walletData.activeMint, walletData.balance, addTransaction]);

  return {
    loading,
    error,
    mints: walletData.mints,
    activeMint: walletData.activeMint,
    activeUnit: walletData.activeUnit,
    balance: walletData.balance,
    transactions: walletData.transactions,
    addMint,
    setActiveMint,
    setActiveUnit,
    getBalance,
    createInvoice,
    checkInvoiceStatus,
    mintTokens,
    receiveToken,
    createSendToken,
    payLightningInvoice,
  };
} 