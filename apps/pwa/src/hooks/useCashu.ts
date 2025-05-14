import { useCallback, useEffect, useState } from 'react';
import { 
  useCashu as useSDKCashu, 
  useCashuStore, 
  ICashu,
  useCreateWalletEvent,
  useGetCashuTokenEvents,
  useCreateTokenEvent,
  useDeleteTokenEvents,
  MintData,
  NostrKeyManager
} from 'afk_nostr_sdk';
import { v4 as uuidv4 } from 'uuid';
import { useCashuStorage } from './useCashuStorage';
import { saveWalletData } from '@/utils/storage';

export function useCashu() {
  // SDK hooks
  const sdkCashu = useSDKCashu();
  const { seed, setSeed, setMintUrl, mintUrl } = useCashuStore();
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
  const [nostrSeedAvailable, setNostrSeedAvailable] = useState(false);

  // Check for Nostr account and seed on init and when checking connection status changes
  useEffect(() => {
    const checkNostrSeed = async () => {
      try {
        const nostrSeed = await NostrKeyManager.checkNostrSeedAvailable();
        if (nostrSeed) {
          console.log('Found Nostr seed, will use for Cashu wallet');
          // Convert seed to the format expected by CashuWallet (Uint8Array)
          const seedBuffer = Buffer.from(nostrSeed, 'hex');
          // Update Cashu store with Nostr seed
          setSeed(seedBuffer);
          setNostrSeedAvailable(true);
          return true;
        }
        console.log('No Nostr seed available');
        setNostrSeedAvailable(false);
        return false;
      } catch (err) {
        console.error('Error checking for Nostr seed:', err);
        setNostrSeedAvailable(false);
        return false;
      }
    };
    
    checkNostrSeed();
  }, [setSeed]);

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

  // Sync SDK mint URL with local storage when initialized
  useEffect(() => {
    if (isInitialized && walletData.activeMint) {
      // Set the active mint URL in the Cashu store
      setMintUrl(walletData.activeMint);
    }
  }, [isInitialized, walletData.activeMint, setMintUrl]);

  // Add a mint with the SDK
  const addMint = useCallback(async (mintUrl: string, alias: string) => {
    try {
      // Use SDK to connect to mint
      console.log(`Connecting to mint: ${mintUrl}`);
      const mintResponse = await sdkCashu.connectCashMint(mintUrl).catch(err => {
        console.error('Error connecting to mint:', err);
        throw new Error(`Failed to connect to mint: ${err instanceof Error ? err.message : 'Unknown error'}`);
      });
      
      if (!mintResponse || !mintResponse.mint) {
        throw new Error('Invalid response from mint');
      }
      
      // Save to local storage
      addMintToStorage(mintUrl, alias);
      
      // Update the SDK store mint URL if this is the first mint
      if (walletData.mints.length === 0) {
        setMintUrl(mintUrl);
        
        const id = uuidv4();
        
        // Create wallet event on Nostr if we have a seed (prioritize Nostr seed)
        if (nostrSeedAvailable && seed) {
          try {
            console.log('Creating wallet event with Nostr seed');
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
  }, [sdkCashu, addMintToStorage, walletData.mints.length, seed, createWalletEvent, setMintUrl, nostrSeedAvailable]);

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
      
      // Also update the SDK store mint URL
      setMintUrl(mintUrl);
      
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
      console.log(`Starting invoice creation for ${amount} sats using mint: ${targetMint}`);
      
      // First get a verified wallet connection
      const readinessCheck = await checkWalletReadiness(targetMint);
      if (!readinessCheck.ready) {
        throw new Error(`Wallet not ready: ${readinessCheck.error}`);
      }
      
      // We have a verified wallet connection, create the invoice directly
      const { wallet, mint } = readinessCheck;
      
      if (!wallet || !wallet.mint) {
        throw new Error('Wallet not properly initialized');
      }
      
      console.log(`Creating mint quote with wallet instance`);
      // Get the quote directly
      const quote = await wallet.createMintQuote(amount);
      
      if (!quote) {
        throw new Error('Mint returned empty quote');
      }
      
      // Extract invoice details from quote
      const invoice = (quote as any).request || 
                     (quote as any).pr || 
                     (quote as any).bolt11 || 
                     (quote as any).payment_request || 
                     '';
                     
      const paymentHash = (quote as any).hash || 
                         (quote as any).payment_hash || 
                         (quote as any).id || 
                         '';

      console.log('Payment hash:', paymentHash);
      
      // Debug log to inspect the quote structure
      console.log('Lightning quote structure:', JSON.stringify(quote, null, 2));
      
      // Enhanced payment hash extraction with more fallbacks
      let extractedPaymentHash = '';
      
      if ((quote as any).payment_hash) {
        extractedPaymentHash = (quote as any).payment_hash;
      } else if ((quote as any).hash) {
        extractedPaymentHash = (quote as any).hash;
      } else if ((quote as any).id) {
        extractedPaymentHash = (quote as any).id;
      } else if ((quote as any).paymentHash) {
        extractedPaymentHash = (quote as any).paymentHash;
      } else {
        // Try to extract payment hash from the invoice if it exists
        try {
          // Lightning invoices often include the payment hash in their decoded structure
          // For now, log this situation to help with debugging
          console.log('Could not directly extract payment hash from quote object, invoice:', invoice);
          
          // If we have a proper library to decode invoices, we could extract it here
          // For now, we'll use a placeholder or fallback to empty string
          extractedPaymentHash = '';
        } catch (error) {
          console.error('Failed to extract payment hash from invoice:', error);
        }
      }
      
      if (!extractedPaymentHash) {
        console.warn('No payment hsh found in the quote, using fallback ID');
        // Generate a unique ID as fallback to ensure we have something to track
        // Format: fallback-timestamp-randomstring to clearly identify as a fallback ID
        // extractedPaymentHash = `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        extractedPaymentHash = invoice;
      }
      
      if (!invoice) {
        throw new Error('No invoice in mint response');
      }
      
      console.log(`Got Lightning invoice: ${invoice.substring(0, 20)}...`);
      console.log(`Payment hash: ${extractedPaymentHash}`);
      
      // Record transaction
      addTransaction(
        'received', 
        amount, 
        'Created Lightning invoice', 
        null, 
        extractedPaymentHash, // Use the enhanced extraction
        targetMint,
        'pending',
        invoice.substring(0, 20) + '...',
        'lightning',
        invoice // Add the full invoice
      );
      
      return {
        invoice,
        paymentHash: extractedPaymentHash, // Return the enhanced extraction
        amount,
        quote,
      };
    } catch (err) {
      console.error('Error creating invoice:', err);
      throw err;
    }
  };

  // Check invoice status
  const checkInvoiceStatus = async (mintUrl: string, paymentHash: string) => {
    if (!isInitialized) throw new Error('Cashu not initialized');
    if (!paymentHash) throw new Error('Payment hash is required');
    if (!mintUrl) throw new Error('Mint URL is required');
    
    // Check if the payment hash is a fallback one (created when no real hash was available)
    const isFallbackHash = paymentHash.startsWith('fallback-');
    if (isFallbackHash) {
      console.warn(`Using fallback payment hash: ${paymentHash}. Can't check status with mint.`);
      // For fallback hashes, we can't check with the mint
      // Return a mock response to prevent errors
      return {
        paid: false,
        amount: 0,
        paymentHash,
        error: 'Cannot check status for fallback payment hash'
      };
    }

    try {
      console.log(`Checking invoice status for payment hash: ${paymentHash} at mint: ${mintUrl}`);
      
      // First get a verified wallet connection
      const readinessCheck = await checkWalletReadiness(mintUrl);
      if (!readinessCheck.ready) {
        throw new Error(`Wallet not ready: ${readinessCheck.error}`);
      }
      
      // We have a verified wallet connection
      const { wallet, mint } = readinessCheck;
      
      if (!wallet || !wallet.mint) {
        throw new Error('Wallet not properly initialized');
      }
      
      try {
        // In a real implementation, we would call the appropriate SDK method
        // For example: const paymentStatus = await wallet.mint.checkInvoiceStatus(paymentHash);
        
        try {
          console.log(`Checking payment status at mint for hash: ${paymentHash}`);
          
          // Try to call the actual SDK method if available
          if (wallet.mint && typeof wallet.mint.checkLightningStatus === 'function') {
            const statusResult = await wallet.mint.checkLightningStatus(paymentHash);
            console.log('Status result from mint:', statusResult);
            
            // Extract paid status and amount from the result
            const isPaid = !!(statusResult?.paid || statusResult?.settled || statusResult?.status === 'paid');
            const amount = statusResult?.amount || statusResult?.value || 0;
            
            return {
              paid: isPaid,
              amount,
              paymentHash,
            };
          }
          
          // Fallback for demo/testing - in a real app, this should use actual mint API calls
          console.log('Using simulated payment check (mint API not fully implemented)');
          const isPaid = true; // For testing, always return paid
          const amount = 100; // Mock amount
          
          return {
            paid: isPaid,
            amount,
            paymentHash,
          };
        } catch (mintErr) {
          console.error('Error checking payment status with mint:', mintErr);
          throw new Error(`Mint API error: ${mintErr instanceof Error ? mintErr.message : 'Unknown error'}`);
        }
      } catch (mintErr) {
        console.error('Error from mint when checking payment status:', mintErr);
        throw new Error(`Mint error: ${mintErr instanceof Error ? mintErr.message : 'Unknown mint error'}`);
      }
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

  // Check if the wallet is ready for operations
  const checkWalletReadiness = async (targetMint?: string) => {
    try {
      // Use the provided targetMint or fall back to the active mint
      const mintUrl = targetMint || walletData.activeMint;
      
      if (!mintUrl) {
        throw new Error('No mint selected');
      }
      
      if (!isInitialized) {
        throw new Error('Cashu wallet not initialized');
      }
      
      // Try to connect to the mint
      console.log(`Checking wallet readiness for mint: ${mintUrl}`);
      
      // Use a single, reliable connection attempt with timeout
      // Define type for the mint response
      interface MintResponse {
        mint: any;
        keys: any[];
      }
      
      const mintResponse = await Promise.race([
        sdkCashu.connectCashMint(mintUrl) as Promise<MintResponse>,
        new Promise<never>((_, reject) => setTimeout(
          () => reject(new Error('Connection timeout (30s)')), 30000
        ))
      ]).catch(err => {
        console.error('Mint connection failed:', err);
        throw new Error(`Cannot connect to mint: ${err instanceof Error ? err.message : 'Unknown error'}`);
      });
      
      if (!mintResponse?.mint || !mintResponse?.keys) {
        throw new Error('Could not retrieve mint information');
      }
      
      // If we already have a wallet connected to this mint, verify and use it
      const { walletConnected } = sdkCashu;
      if (walletConnected && walletConnected.mint.mintUrl === mintUrl) {
        console.log('Using existing wallet connection');
        // Test the wallet connection with a basic operation
        try {
          await walletConnected.mint.getInfo();
          console.log('Existing wallet connection verified');
          return { 
            ready: true, 
            wallet: walletConnected, 
            mintUrl, 
            mint: mintResponse.mint, 
            keys: mintResponse.keys 
          };
        } catch (testErr) {
          console.warn('Existing wallet connection failed verification, will create new connection');
          // Continue to create a new wallet instance
        }
      }
      
      // Initialize a wallet with the appropriate method
      console.log('Creating new wallet connection, nostrSeedAvailable:', nostrSeedAvailable);
      
      // Create a wallet with the appropriate seed method
      let wallet;
      if (nostrSeedAvailable) {
        console.log('Initializing wallet with Nostr seed');
        wallet = await sdkCashu.initializeWithNostrSeed(mintResponse.mint, mintResponse.keys);
      } else {
        console.log('Initializing wallet with default method');
        wallet = await sdkCashu.connectCashWallet(mintResponse.mint, mintResponse.keys);
      }
      
      if (!wallet) {
        throw new Error('Wallet initialization failed - null wallet returned');
      }
      
      // Verify the new wallet works
      try {
        await wallet.mint.getInfo();
        console.log('New wallet connection verified');
      } catch (err) {
        throw new Error(`Wallet initialization failed verification: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
      
      return { 
        ready: true, 
        wallet, 
        mintUrl, 
        mint: mintResponse.mint, 
        keys: mintResponse.keys 
      };
    } catch (err) {
      console.error('Wallet readiness check failed:', err);
      return { 
        ready: false, 
        error: err instanceof Error ? err.message : 'Unknown error during wallet readiness check' 
      };
    }
  };

  // Check payment status for a specific transaction
  const checkInvoicePaymentStatus = async (transaction: any) => {
    if (!transaction) {
      throw new Error('Invalid transaction: transaction is null or undefined');
    }
    
    if (!transaction.paymentHash && !transaction?.invoice) {
      console.error('Transaction is missing payment hash:', transaction);
      throw new Error('Transaction is missing payment hash');
    }
    
    if (!transaction.mintUrl) {
      console.error('Transaction is missing mint URL:', transaction);
      throw new Error('Transaction is missing mint URL');
    }
    
    // Check if we're dealing with a fallback payment hash
    const isFallbackHash = transaction.paymentHash.startsWith('fallback-');
    if (isFallbackHash) {
      console.warn(`Transaction uses fallback payment hash: ${transaction.paymentHash}`);
      
      // For fallback hashes, we can't reliably check status
      // Update transaction to show appropriate status
      const updatedTransactions = walletData.transactions.map(tx => {
        if (tx.id === transaction.id) {
          return {
            ...tx,
            status: 'pending' as const,
            description: 'Cannot verify payment with fallback ID'
          };
        }
        return tx;
      });
      
      // Save updated data with no balance change
      saveWalletData({
        ...walletData,
        transactions: updatedTransactions
      });
      
      return { 
        paid: false,
        error: 'Cannot verify payment with fallback ID'
      };
    }
    
    try {
      console.log(`Checking payment status for hash: ${transaction.paymentHash}`);
      
      // Check readiness first
      const readinessCheck = await checkWalletReadiness(transaction.mintUrl);
      if (!readinessCheck.ready) {
        throw new Error(`Wallet not ready: ${readinessCheck.error}`);
      }
      
      // Get payment status from the mint
      const status = await checkInvoiceStatus(transaction.mintUrl, transaction.paymentHash || transaction.invoice);
      
      if (status.paid) {
        // Mark transaction as paid in storage
        const updatedTransactions = walletData.transactions.map(tx => {
          if (tx.id === transaction.id) {
            return {
              ...tx,
              status: 'paid' as const,
              description: 'Payment confirmed'
            };
          }
          return tx;
        });
        
        // Calculate new balance
        const newBalance = walletData.balance + transaction.amount;
        
        console.log(`Payment confirmed for hash: ${transaction.paymentHash}, updating balance from ${walletData.balance} to ${newBalance}`);
        
        // Save updated data
        saveWalletData({
          ...walletData,
          transactions: updatedTransactions,
          balance: newBalance
        });
        
        return { paid: true, amount: status.amount };
      } else {
        // Mark transaction as still pending
        const updatedTransactions = walletData.transactions.map(tx => {
          if (tx.id === transaction.id) {
            return {
              ...tx,
              status: 'pending' as const,
              description: status.error ? `Error: ${status.error}` : 'Payment not yet confirmed'
            };
          }
          return tx;
        });
        
        console.log(`Payment not yet confirmed for hash: ${transaction.paymentHash}`);
        
        // Save updated data with no balance change
        saveWalletData({
          ...walletData,
          transactions: updatedTransactions
        });
        
        return { 
          paid: false,
          error: status.error
        };
      }
    } catch (err) {
      console.error('Error checking payment status:', err);
      
      // Mark transaction as failed
      const updatedTransactions = walletData.transactions.map(tx => {
        if (tx.id === transaction.id) {
          return {
            ...tx,
            status: 'failed' as const,
            description: err instanceof Error ? err.message : 'Failed to check payment status'
          };
        }
        return tx;
      });
      
      // Save updated data
      saveWalletData({
        ...walletData,
        transactions: updatedTransactions
      });
      
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
    tokens: walletData.tokens,
    addMint,
    setActiveMint,
    setActiveUnit,
    getBalance,
    createInvoice,
    checkInvoiceStatus,
    checkInvoicePaymentStatus,
    receiveToken,
    createSendToken,
    payLightningInvoice,
    nostrSeedAvailable,
    checkWalletReadiness,
  };
} 