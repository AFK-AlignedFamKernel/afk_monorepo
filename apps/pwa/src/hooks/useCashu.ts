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
      const mintResponse = await sdkCashu.connectCashMint(mintUrl).catch(err => {
        console.error('Error connecting to mint:', err);
        throw new Error(`Failed to connect to mint: ${err instanceof Error ? err.message : 'Unknown error'}`);
      });
      
      if (!mintResponse || !mintResponse.mint) {
        throw new Error('Invalid response from mint');
      }
      
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
            // Don't throw here - continue even if event creation fails
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
  const setActiveMint = async (mintUrl: string) => {
    try {
      // Connect to mint to ensure it's accessible
      const connectResponse = await sdkCashu.connectCashMint(mintUrl).catch(err => {
        console.error('Error in connectCashMint:', err);
        return null;
      });
      
      // Continue even if connection fails - just log it
      if (!connectResponse || !connectResponse.mint) {
        console.warn('Could not connect to mint, but continuing with selection');
      }
      
      // Save to storage regardless of connection result
      setActiveMintInStorage(mintUrl);
      
      return true;
    } catch (err) {
      console.error('Error connecting to mint:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to mint');
      // Return false but don't crash
      return false;
    }
  };

  // Set active unit
  const setActiveUnit = useCallback((unit: string) => {
    setActiveUnitInStorage(unit);
  }, [setActiveUnitInStorage]);

  // Get balance for the active mint/unit
  const getBalance = async () => {
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
  };

  // Create a Lightning invoice
  const createInvoice = async (mintUrl?: string, amount?: number) => {
    if (!isInitialized) throw new Error('Cashu not initialized');
    
    // Use the provided mintUrl or fall back to the active mint
    const targetMint = mintUrl || walletData.activeMint;
    
    // Validate we have a mint and amount
    if (!targetMint) throw new Error('No mint selected');
    if (!amount || amount <= 0) throw new Error('Invalid amount');

    try {
      // Connect to the real mint
      console.log(`Connecting to mint: ${targetMint}`);
      const mintResponse = await sdkCashu.connectCashMint(targetMint).catch(err => {
        console.error('Error connecting to mint:', err);
        throw new Error(`Mint connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      });
      
      if (!mintResponse?.mint || !mintResponse?.keys) {
        throw new Error('Failed to connect to mint');
      }
      
      // Create a wallet with the mint
      const wallet = await sdkCashu.connectCashWallet(mintResponse.mint, mintResponse.keys).catch(err => {
        console.error('Error creating wallet:', err);
        throw new Error(`Wallet initialization failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      });
      
      if (!wallet) {
        throw new Error('Failed to initialize wallet for mint');
      }
      
      // Request a real mint quote
      console.log(`Requesting mint quote for ${amount} sats`);
      const quoteResponse = await sdkCashu.requestMintQuote(amount).catch(err => {
        console.error('Error requesting mint quote:', err);
        throw new Error(`Mint quote request failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      });
      
      if (!quoteResponse) {
        throw new Error('Mint returned null response');
      }
      
      if (!quoteResponse.request) {
        throw new Error('Mint returned invalid quote format');
      }
      
      const { request } = quoteResponse;
      
      // Extract invoice details from the quote
      // Cast to any to handle potential format differences between mints
      const mintRequest = request as any;
      const invoice = mintRequest.request || mintRequest.pr || mintRequest.payment_request || '';
      const paymentHash = mintRequest.hash || mintRequest.payment_hash || '';
      
      if (!invoice) {
        throw new Error('No invoice in mint response');
      }
      
      console.log(`Successfully created invoice: ${invoice.substring(0, 20)}...`);
      
      // Record a transaction for this invoice
      addTransaction('received', amount, 'Created Lightning invoice', null);
      
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
  };

  // Check invoice status
  const checkInvoiceStatus = async (mintUrl: string, paymentHash: string) => {
    if (!isInitialized) throw new Error('Cashu not initialized');

    try {
      // Try to connect to mint
      const mintResponse = await sdkCashu.connectCashMint(mintUrl).catch(err => {
        console.error('Error connecting to mint for status check:', err);
        throw new Error('Failed to connect to mint for invoice check');
      });
      
      if (!mintResponse?.mint) {
        throw new Error('Invalid mint response when checking invoice');
      }
      
      // In a real implementation, would check with the mint
      // This is a simplified response for now
      return {
        paid: true,
        amount: 100,
        paymentHash,
      };
    } catch (err) {
      console.error('Error checking invoice status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check invoice status');
      // Return a safe default to prevent UI crashes
      return {
        paid: false,
        amount: 0,
        paymentHash,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  };

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
  const receiveToken = async (token: string) => {
    if (!isInitialized) throw new Error('Cashu not initialized');

    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token format: token is missing or not a string');
      }
      
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
  };

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
  const payLightningInvoice = async (invoice: string) => {
    if (!isInitialized) throw new Error('Cashu not initialized');
    if (!walletData.activeMint) throw new Error('No active mint selected');
    
    try {
      if (!invoice || typeof invoice !== 'string') {
        throw new Error('Invalid invoice: missing or not a string');
      }
      
      // Try to connect to mint first
      const mintResponse = await sdkCashu.connectCashMint(walletData.activeMint).catch(err => {
        console.error('Error connecting to mint for payment:', err);
        throw new Error('Failed to connect to mint for payment');
      });
      
      if (!mintResponse?.mint) {
        throw new Error('Invalid mint response when trying to pay');
      }
      
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
  };

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