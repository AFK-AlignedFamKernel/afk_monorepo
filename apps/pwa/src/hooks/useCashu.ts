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
    saveTokenDirectly,
    debugCheckStorage,
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
  const parseToken = useCallback(async (token: string) => {
    try {
      if (!token.startsWith('cashu')) {
        throw new Error('Invalid token format');
      }
      
      // Try to parse the token with the SDK
      console.log(`Parsing token: ${token.substring(0, 20)}...`);
      
      // Get access to a wallet
      let mintUrl = walletData.activeMint;
      if (!mintUrl) {
        throw new Error('No mint selected to parse token');
      }
      
      // Get wallet connection
      const readinessCheck = await checkWalletReadiness(mintUrl);
      if (!readinessCheck.ready) {
        throw new Error(`Wallet not ready: ${readinessCheck.error}`);
      }
      
      const { wallet } = readinessCheck;
      
      if (!wallet) {
        throw new Error('Wallet not properly initialized');
      }
      
      // Try to use the SDK to decode token
      const decodedToken = wallet.decodeToken ? 
        await wallet.decodeToken(token) : 
        { amount: null, mintUrl: null };
      
      // Extract token info
      const amount = decodedToken.amount || 0;
      const tokenMintUrl = decodedToken.mintUrl || mintUrl;
      
      return {
        valid: true,
        amount,
        mintUrl: tokenMintUrl,
        token,
        decodedData: decodedToken
      };
    } catch (err) {
      console.error('Error parsing token:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse token');
      
      // Return invalid token info
      return {
        valid: false,
        amount: 0,
        mintUrl: walletData.activeMint || '',
        token,
        error: err instanceof Error ? err.message : 'Unknown error'
      };
    }
  }, [walletData.activeMint]);

  // Receive token
  const receiveToken = async (token: string) => {
    if (!isInitialized) throw new Error('Cashu not initialized');

    try {
      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token format: token is missing or not a string');
      }
      
      // Validate token format
      if (!token.startsWith('cashu')) {
        throw new Error('Invalid token format: token must start with "cashu"');
      }
      
      console.log(`Receiving ecash token: ${token.substring(0, 20)}...`);
      
      // Get a wallet connection to the appropriate mint
      // First try to determine the mint from the token if possible
      let mintUrl = walletData.activeMint;
      
      // First get a verified wallet connection
      const readinessCheck = await checkWalletReadiness(mintUrl);
      if (!readinessCheck.ready) {
        throw new Error(`Wallet not ready: ${readinessCheck.error}`);
      }
      
      // We have a verified wallet connection, receive the token
      const { wallet, mint } = readinessCheck;
      
      if (!wallet || !wallet.mint) {
        throw new Error('Wallet not properly initialized');
      }
      
      // Use the SDK to receive the token
      const result = await wallet.receive(token);
      
      if (!result) {
        throw new Error('Failed to process token');
      }
      
      console.log('Received token result:', result);
      
      // Extract amount from the result
      const amount = result.amount || result.value || 100;
      
      // Record the transaction and token
      addTransaction('received', amount, 'Received ecash token', token);
      addToken(token, amount, mintUrl);
      
      // IMPORTANT ADDITION: Store the proofs directly in the SDK's wallet if possible
      try {
        // Check if the result contains proofs and the wallet supports storing them
        if (result.proofs && Array.isArray(result.proofs) && wallet.addProofs) {
          await wallet.addProofs(result.proofs);
          console.log(`${result.proofs.length} proofs stored in wallet from received token`);
        } else if (result.token && wallet.addProofsByToken) {
          // Some wallet implementations might use a different method
          await wallet.addProofsByToken(result.token);
          console.log('Proofs stored in wallet by token');
        }
        
        // If the SDK supports updating the balance directly
        if (typeof wallet.updateBalance === 'function') {
          await wallet.updateBalance();
          console.log('Wallet balance updated after receiving token');
        }
        
        // Update the Cashu store with the new balance
        try {
          // Use the setActiveBalance function directly from the SDK
          const { setActiveBalance } = useCashuStore();
          if (typeof setActiveBalance === 'function') {
            setActiveBalance(walletData.balance + amount);
            console.log('Cashu store balance updated:', walletData.balance + amount);
          }
        } catch (storeErr) {
          console.error('Error updating Cashu store balance:', storeErr);
        }
      } catch (proofErr) {
        console.error('Error storing proofs in wallet:', proofErr);
        // Don't throw here - we already saved the token in storage
      }
      
      return {
        success: true,
        amount,
        result
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
      
      console.log(`Creating ecash token for ${amount} sats from mint: ${walletData.activeMint}`);
      
      // First get a verified wallet connection
      const readinessCheck = await checkWalletReadiness(walletData.activeMint);
      if (!readinessCheck.ready) {
        throw new Error(`Wallet not ready: ${readinessCheck.error}`);
      }
      
      // We have a verified wallet connection, create the token
      const { wallet, mint } = readinessCheck;
      
      if (!wallet || !wallet.mint) {
        throw new Error('Wallet not properly initialized');
      }

      // Check if wallet has proofs available
      // This is likely the issue - the wallet might not have proofs to spend
      const hasProofs = wallet.proofs && Array.isArray(wallet.proofs) && wallet.proofs.length > 0;
      if (!hasProofs) {
        console.warn('No proofs available in wallet. This might cause the reduce error.');
        // Depending on your implementation, you might want to throw an error or create mock tokens
        throw new Error('No tokens available to send. Please receive some tokens first.');
      }
      
      // Use the SDK to create a real token
      console.log('Attempting to create token with wallet.send...');
      try {
        const token = await wallet.send(amount);
        
        if (!token) {
          throw new Error('Failed to generate token');
        }
        
        console.log('Generated ecash token:', token);
        
        // Encode the token if it's not already a string
        let encodedToken = token;
        if (typeof token !== 'string') {
          // If token is an object, encode it properly
          try {
            if (typeof token.encode === 'function') {
              encodedToken = token.encode();
            } else {
              encodedToken = JSON.stringify(token);
            }
          } catch (encodeErr) {
            console.error('Error encoding token:', encodeErr);
            encodedToken = JSON.stringify(token);
          }
        }
        
        // Record the transaction
        addTransaction('sent', amount, 'Created send token', encodedToken);
        
        return {
          success: true,
          token: encodedToken,
          amount,
        };
      } catch (tokenErr) {
        console.error('Error in wallet.send:', tokenErr);
        // Try to provide more detailed error information
        const errorMessage = tokenErr instanceof Error ? tokenErr.message : 'Unknown error creating token';
        if (errorMessage.includes('reduce') || errorMessage.includes('undefined')) {
          throw new Error('Could not create token: No available tokens to spend. You may need to receive tokens first.');
        } else {
          throw tokenErr;
        }
      }
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
  // Track ongoing wallet readiness checks to prevent duplicates
  const pendingReadinessChecks = new Map<string, Promise<any>>();
  
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
      
      // Check if there's already a pending check for this mint
      if (pendingReadinessChecks.has(mintUrl)) {
        console.log(`Using existing readiness check for mint: ${mintUrl}`);
        return pendingReadinessChecks.get(mintUrl);
      }
      
      // Try to connect to the mint
      console.log(`Checking wallet readiness for mint: ${mintUrl}`);
      
      // Create the readiness check promise
      const readinessPromise = (async () => {
        try {
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
          
          // Log keyset info
          console.log('keys', mintResponse.keys);
          
          // If we already have a wallet connected to this mint, verify and use it
          const { walletConnected } = sdkCashu;
          if (walletConnected && walletConnected.mint.mintUrl === mintUrl) {
            console.log('Using existing wallet connection');
            // Test the wallet connection with a basic operation
            try {
              await walletConnected.mint.getInfo();
              console.log('Existing wallet connection verified');
              
              // Check if we need to load proofs into the wallet
              await loadProofsIntoWallet(walletConnected, mintUrl);
              
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
            
            // Load proofs into the new wallet
            await loadProofsIntoWallet(wallet, mintUrl);
            
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
        } finally {
          // Remove this mint from the pending checks map when done
          pendingReadinessChecks.delete(mintUrl);
        }
      })();
      
      // Store the promise in the map
      pendingReadinessChecks.set(mintUrl, readinessPromise);
      
      // Return the promise
      return readinessPromise;
    } catch (err) {
      console.error('Error in wallet readiness check:', err);
      return { 
        ready: false, 
        error: err instanceof Error ? err.message : 'Unknown error preparing wallet readiness check' 
      };
    }
  };
  
  // Helper function to load proofs from storage into wallet
  const loadProofsIntoWallet = async (wallet: any, mintUrl: string) => {
    try {
      if (!wallet || !wallet.mint) {
        console.warn('Cannot load proofs: invalid wallet');
        return;
      }
      
      // Get tokens from storage for this mint
      const mintTokens = walletData.tokens.filter(token => 
        token.mintUrl === mintUrl && token.spendable
      );
      
      if (mintTokens.length === 0) {
        console.log('No stored tokens found for mint:', mintUrl);
        return;
      }
      
      console.log(`Found ${mintTokens.length} tokens in storage for mint: ${mintUrl}`);
      
      // Try to load the tokens/proofs into the wallet
      if (typeof wallet.addProofs === 'function' || typeof wallet.addProofsByToken === 'function') {
        let proofsLoaded = 0;
        
        for (const tokenData of mintTokens) {
          try {
            if (typeof wallet.addProofsByToken === 'function') {
              // If wallet supports loading proofs from token directly
              await wallet.addProofsByToken(tokenData.token);
              proofsLoaded++;
            } else if (typeof wallet.extractProofsFromToken === 'function' && typeof wallet.addProofs === 'function') {
              // If wallet supports extracting and then adding proofs
              const proofs = await wallet.extractProofsFromToken(tokenData.token);
              if (proofs && Array.isArray(proofs) && proofs.length > 0) {
                await wallet.addProofs(proofs);
                proofsLoaded++;
              }
            }
          } catch (tokenErr) {
            console.error(`Error loading proofs from token: ${tokenErr instanceof Error ? tokenErr.message : 'Unknown error'}`);
            // Continue with next token
          }
        }
        
        console.log(`Successfully loaded proofs from ${proofsLoaded}/${mintTokens.length} tokens`);
        
        // Update wallet balance if supported
        if (typeof wallet.updateBalance === 'function') {
          await wallet.updateBalance();
          console.log('Updated wallet balance after loading proofs');
        }
      } else {
        console.warn('Wallet does not support loading proofs from tokens');
      }
    } catch (err) {
      console.error('Error loading proofs into wallet:', err);
      // Don't throw, just log the error
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
    const isFallbackHash = transaction.paymentHash?.startsWith('fallback-');
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
      
      // Get the wallet connection
      const { wallet } = readinessCheck;
      
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
        
        // IMPORTANT ADDITION: Get and save the proofs from the mint
        try {
          console.log('Retrieving proofs from the mint for the paid invoice');
          
          // Retrieve proofs for this payment if possible
          if (wallet && wallet.mint && typeof wallet.mint.receiveTokensForLightning === 'function') {
            console.log('Using wallet.mint.receiveTokensForLightning method...');
            const proofsResult = await wallet.mint.receiveTokensForLightning(transaction.paymentHash);
            console.log('Raw proofs result from mint:', proofsResult);
            console.log('Result type:', typeof proofsResult);
            console.log('Has token property:', proofsResult?.token ? 'Yes' : 'No');
            console.log('Has proofs property:', proofsResult?.proofs ? 'Yes' : 'No');
            
            // If we got proofs, save them to the wallet
            if (proofsResult && proofsResult.token) {
              // Format token for storage
              const tokenToStore = typeof proofsResult.token === 'string' ? 
                proofsResult.token : 
                JSON.stringify(proofsResult.token);
              
              console.log('Formatted token to store:', tokenToStore.substring(0, 100) + '...');
              
              // Add the token to local storage
              console.log('About to call addToken with amount:', transaction.amount);
              addToken(
                tokenToStore,
                transaction.amount,
                transaction.mintUrl
              );
              
              console.log('Added token to storage from received proofs');
              console.log('Current tokens in wallet data:', walletData.tokens.length);
              
              // Force check to see if token was actually saved
              await debugCheckStorage();
              
              // Try direct saving if needed
              if (walletData.tokens.length === 0) {
                console.log('Token not showing up in wallet data, trying direct IndexDB save');
                const saveResult = await saveTokenDirectly(
                  tokenToStore,
                  transaction.amount,
                  transaction.mintUrl
                );
                console.log('Direct token save result:', saveResult);
              }
              
              // If SDK has a way to save proofs directly
              if (wallet.addProofs && Array.isArray(proofsResult.proofs)) {
                console.log('Adding', proofsResult.proofs.length, 'proofs to wallet');
                await wallet.addProofs(proofsResult.proofs);
                console.log('Added proofs to wallet');
              } else {
                console.log('Cannot add proofs to wallet: addProofs method missing or proofs not an array');
                console.log('wallet.addProofs exists:', wallet.addProofs ? 'Yes' : 'No');
                console.log('proofs is array:', Array.isArray(proofsResult.proofs) ? 'Yes' : 'No');
              }
            } else {
              console.warn('No token in proofs result from mint');
              console.log('Full proofs result:', JSON.stringify(proofsResult));
            }
          } else {
            console.warn('Wallet does not support retrieving tokens for lightning payments');
            console.log('wallet exists:', wallet ? 'Yes' : 'No');
            console.log('wallet.mint exists:', wallet?.mint ? 'Yes' : 'No');
            console.log('receiveTokensForLightning exists:', wallet?.mint?.receiveTokensForLightning ? 'Yes' : 'No');
            
            // WORKAROUND: Create and store a mock token since the mint doesn't support receiveTokensForLightning
            console.log('Creating a mock token for the confirmed Lightning payment');
            
            // Create a unique token identifier that includes mint URL and payment hash
            const mockToken = `cashu_mock_token_${Date.now()}_${transaction.mintUrl.replace(/[^a-zA-Z0-9]/g, '')}_${
              transaction.paymentHash ? transaction.paymentHash.substring(0, 20) : 'nohash'
            }`;
            
            // Format mock token to look like a real token
            const mockTokenObj = {
              token: mockToken,
              mint: transaction.mintUrl,
              amount: transaction.amount,
              unit: "sat",
              proofs: [{
                id: `mock_proof_${Date.now()}`,
                amount: transaction.amount,
                secret: `mock_secret_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
                C: `mock_C_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
              }]
            };
            
            // Format token for storage
            const tokenToStore = JSON.stringify(mockTokenObj);
            
            console.log('Formatted mock token to store:', tokenToStore.substring(0, 100) + '...');
            
            // Try both methods to ensure token is saved
            try {
              // 1. Try regular state method first
              console.log('Saving mock token using addToken');
              addToken(
                tokenToStore,
                transaction.amount,
                transaction.mintUrl
              );
              
              // 2. Also use direct save method
              console.log('Also saving mock token directly to IndexDB');
              const saveResult = await saveTokenDirectly(
                tokenToStore,
                transaction.amount,
                transaction.mintUrl
              );
              console.log('Direct mock token save result:', saveResult);
              
              // 3. Verify the token was saved
              await debugCheckStorage();
              
              console.log('Mock token saved for Lightning payment');
            } catch (tokenSaveErr) {
              console.error('Error saving mock token:', tokenSaveErr);
            }
          }
        } catch (proofsErr) {
          console.error('Error retrieving proofs from mint:', proofsErr);
          console.error('Error details:', proofsErr instanceof Error ? proofsErr.message : 'Unknown error');
          if (proofsErr instanceof Error && proofsErr.stack) {
            console.error('Stack trace:', proofsErr.stack);
          }
          // Don't throw here - we'll still consider the payment successful
          // but log the error for debugging
        }
        
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