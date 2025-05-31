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
import {
  db,
  mintsApi,
  settingsApi,
  proofsApi,
  proofsByMintApi,
  proofsSpentsApi,
  proofsSpentsByMintApi,
  invoicesApi,
  saveWalletData,
  transactionsApi,
  Transaction
} from '@/utils/storage';
import { migrateFromLegacyStorage, getOrCreateWalletId } from '../utils/migrateStorage';
import { useCashuContext } from '@/providers/CashuProvider';
import { getDecodedToken, getEncodedToken, getEncodedTokenV4 } from '@cashu/cashu-ts';

// Define the expected response type from selectProofsToSend
interface ProofsSelectionResponse {
  send: any[];
  change?: any[];
}

export function useCashu() {
  // SDK hooks
  const sdkCashu = useSDKCashu();
  const { seed, setSeed, setMintUrl, mintUrl } = useCashuStore();
  const { mutateAsync: createWalletEvent } = useCreateWalletEvent();
  const { mutateAsync: createToken } = useCreateTokenEvent();
  const { data: tokensEvents } = useGetCashuTokenEvents();
  const { mutateAsync: deleteTokens } = useDeleteTokenEvents();
  const { meltTokens, } = useCashuContext();

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
    updateTransaction,
    setBalance,
    balance,
    setWalletData
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

  // Add function to calculate balance from proofs
  const calculateBalanceFromProofs = async (mintUrl: string) => {
    try {
      // Get active proofs for the mint
      const activeProofs = await proofsByMintApi.getByMintUrl(mintUrl);

      // Calculate total from active proofs
      const activeBalance = activeProofs.reduce((sum, proof) => sum + (proof.amount || 0), 0);

      // Get spent proofs for the mint
      const spentProofs = await proofsSpentsByMintApi.getByMintUrl(mintUrl);

      // Calculate total from spent proofs
      // const spentBalance = spentProofs.reduce((sum, proof) => sum + (proof.amount || 0), 0);
      const spentBalance = spentProofs.reduce((sum, proof) => sum + (proof.amount || 0), 0);

      // Update the balance in the store
      const newBalance = activeBalance;
      // const newBalance = activeBalance - spentBalance;
      console.log("newBalance", newBalance);
      setBalance(newBalance);

      const newWalletData = {
        ...walletData,
        balance: newBalance,
      };
      setWalletData(newWalletData);

      return newBalance;
    } catch (error) {
      console.error('Error calculating balance from proofs:', error);
      return 0;
    }
  };

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
    if (!targetMint) throw new Error('No mint selected');

    // Default amount if not specified
    const paymentAmount = amount && amount > 0 ? amount : 100;  // Default 100 sats

    try {
      console.log(`Creating invoice for ${paymentAmount} sats at mint: ${targetMint}`);

      // First get a verified wallet connection
      const readinessCheck = await checkWalletReadiness(targetMint);
      if (!readinessCheck.ready) {
        throw new Error(`Wallet not ready: ${readinessCheck.error}`);
      }

      // We have a verified wallet connection
      const { wallet } = readinessCheck;

      if (!wallet || !wallet.mint) {
        throw new Error('Wallet not properly initialized');
      }

      // Create mint quote with the SDK
      console.log(`Creating mint quote with wallet for ${paymentAmount} sats`);
      const quote = await wallet.createMintQuote(paymentAmount);

      if (!quote) {
        throw new Error('Mint returned empty quote response');
      }

      console.log('Received quote from mint:', quote);

      // Extract the invoice and payment hash
      const invoice = quote.request || '';
      if (!invoice) {
        throw new Error('No invoice in mint response');
      }

      // Extract payment hash from the quote
      const paymentHash = quote.quote || quote.id || '';

      console.log(`Got invoice from mint, payment hash/id: ${paymentHash}`);

      // Record the transaction
      addTransaction(
        'received',
        paymentAmount,
        'Created Lightning invoice',
        null,
        paymentHash,
        targetMint,
        'pending',
        invoice.substring(0, 20) + '...',
        'lightning',
        invoice,
        quote.quote // Store the quote for later verification
      );

      return {
        invoice,
        paymentHash,
        amount: paymentAmount,
        quote,
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
        // Try to use SDK's checkMintQuote first if this is a proper quote
        if (wallet.checkMintQuote) {
          try {
            console.log(`Checking payment status using checkMintQuote for: ${paymentHash}`);
            const quoteStatus = await wallet.checkMintQuote(paymentHash);
            console.log('Quote status result:', quoteStatus);

            if (quoteStatus) {
              // Extract payment status and amount from quote
              const isPaid = quoteStatus.paid || quoteStatus.state === 'PAID';
              const amount = quoteStatus.amount || quoteStatus.value || 0;

              return {
                paid: isPaid,
                amount,
                paymentHash,
                quote: quoteStatus
              };
            }
          } catch (quoteErr) {
            console.warn('Error checking with checkMintQuote - might not be a mint quote:', quoteErr);
            // Continue with lightning check as fallback
          }
        }

        // Fallback to Lightning status check
        try {
          console.log(`Checking lightning payment status for hash: ${paymentHash}`);

          // Try to call the SDK method if available
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

          // Fallback for testing - in a real app, this should use actual mint API calls
          console.log('Using simulated payment check (mint API not fully implemented)');
          const isPaid = true; // For testing, always return paid
          const amount = 100; // Mock amount

          return {
            paid: isPaid,
            amount,
            paymentHash,
          };
        } catch (lightningErr) {
          console.error('Error checking lightning payment status:', lightningErr);
          throw new Error(`Lightning API error: ${lightningErr instanceof Error ? lightningErr.message : 'Unknown error'}`);
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
      console.log("wallet", wallet)
      const result = await wallet.receive(token);
      console.log("result", result)

      if (!result) {
        throw new Error('Failed to process token');
      }

      console.log('Received token result:', result);

      // Extract amount from the result
      const amount = result.amount || result.value ||
        (result && Array.isArray(result) && result.reduce((sum, item) => sum + (item?.amount || 0), 0));

      // Calculate new balance immediately
      const newBalance = walletData.balance + amount;
      // console.log("new Balance")
      console.log(`Updating balance from ${walletData.balance} to ${newBalance}`);

      // Update balance immediately
      setBalance(newBalance);

      // Record the transaction and token
      addTransaction('received', amount, 'Received ecash token', token);


      // Update wallet data with new balance
      const newWalletData = {
        ...walletData,
        balance: newBalance
      };
      setWalletData(newWalletData);
      console?.log("wallet", wallet?.mint)

      console.log('try saved proofs', result)
      try {
        await proofsByMintApi.addProofsForMint(result, walletData?.activeMint ?? wallet?.mint?.mintUrl ?? "");
        const allProofs = await proofsApi.getAll();
        await proofsApi.setAll([...allProofs, ...result]);
      } catch (err) {
        console.error('Error saving proofs:', err);
      }

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

        // Update wallet data with new balance
        const newWalletData = {
          ...walletData,
          balance: newBalance
        };
        setWalletData(newWalletData);

        // Save to storage
        saveWalletData(newWalletData);

      } catch (proofErr) {
        console.error('Error storing proofs in wallet:', proofErr);
        // Even if proof storage fails, we still want to update the balance
        const newWalletData = {
          ...walletData,
          balance: newBalance
        };
        setWalletData(newWalletData);
        saveWalletData(newWalletData);
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



  // Check if the wallet is ready for operations
  // Track ongoing wallet readiness checks to prevent duplicates
  const pendingReadinessChecks = new Map<string, Promise<any>>();

  const initializeWalletCashu = (targetMint?: string) => {
    try {
      // Use the provided targetMint or fall back to the active mint
      const mintUrl = targetMint || walletData.activeMint;

      if (!mintUrl) {
        throw new Error('No mint selected');
      }


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
    } catch (e) {
      console.log("Error init wallet", e)
    }
  }
  const checkWalletReadiness = async (targetMint?: string) => {
    try {
      // Use the provided targetMint or fall back to the active mint
      const mintUrl = targetMint || walletData.activeMint;

      if (!mintUrl) {
        throw new Error('No mint selected');
      }

      if (!isInitialized) {
        const res = await initializeWalletCashu(targetMint)

        if (!res) {
          throw new Error('Cashu wallet not initialized');
        }
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

    if (!transaction.paymentHash && !transaction?.invoice && !transaction?.quote) {
      console.error('Transaction is missing payment hash or quote:', transaction);
      throw new Error('Transaction is missing payment hash, invoice, or quote ID');
    }

    if (!transaction.mintUrl) {
      console.error('Transaction is missing mint URL:', transaction);
      throw new Error('Transaction is missing mint URL');
    }

    try {
      console.log(`Checking payment status for quote/hash: ${transaction.quote || transaction.paymentHash}`);

      // Check readiness first
      const readinessCheck = await checkWalletReadiness(transaction.mintUrl);
      if (!readinessCheck.ready) {
        throw new Error(`Wallet not ready: ${readinessCheck.error}`);
      }

      // Get the wallet connection
      const { wallet } = readinessCheck;

      if (!wallet) {
        throw new Error('Wallet not properly initialized');
      }

      // Use the SDK to check the mint quote directly
      // Always prefer to use transaction.quote if available
      const quoteToCheck = transaction.quote || transaction.paymentHash;
      console.log(`Checking mint quote status for: ${quoteToCheck}`);

      let isPaid = false;
      let quoteData = null;

      try {
        // Use checkMintQuote which is the recommended method
        quoteData = await wallet.checkMintQuote(quoteToCheck);
        console.log('Quote check result:', quoteData);

        if (quoteData) {
          // Check for different possible state indicators
          isPaid = quoteData?.paid === true ||
            quoteData?.state === 'PAID' ||
            quoteData?.status === 'paid';
        }
      } catch (err) {
        console.warn('Error checking quote status:', err);
        return { paid: false, error: 'Failed to check payment status' };
      }

      const amount = quoteData?.amount || quoteData?.value || transaction.amount || 0;

      // If payment is confirmed, update transaction and get tokens
      if (isPaid) {
        console.log(`Payment confirmed for quote: ${quoteToCheck}`);

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

        console.log(`Updating balance from ${walletData.balance} to ${newBalance}`);

        // Get and save the proofs from the mint
        try {
          console.log('Retrieving proofs from the mint for the paid invoice');

          // First determine if we have a quote to check
          const paymentQuote = transaction.quote || transaction.paymentHash;
          if (!paymentQuote) {
            console.warn('No quote available to mint tokens');
          } else {
            console.log(`Minting proofs for ${transaction.amount} sats using quote: ${paymentQuote}`);
            const proofs = await wallet.mintProofs(transaction.amount, paymentQuote);

            if (proofs && Array.isArray(proofs) && proofs.length > 0) {
              console.log(`Successfully minted ${proofs.length} proofs from mint`);

              // Add the proofs to wallet
              if (wallet.addProofs) {
                await wallet.addProofs(proofs);
                console.log('Added proofs to wallet');
              }

              // Save proofs to the database
              try {
                // First save the proofs to the databases
                if (typeof proofsApi !== 'undefined' && typeof proofsByMintApi !== 'undefined') {
                  // First get existing proofs for this mint
                  const existingProofs = await proofsByMintApi.getByMintUrl(transaction.mintUrl);

                  // Merge and deduplicate proofs by C value
                  let allProofs = [...existingProofs, ...proofs];
                  allProofs = allProofs.filter((proof, index, self) =>
                    index === self.findIndex((t) => t?.C === proof?.C)
                  );

                  // Save back to database - both general proofs and mint-specific proofs
                  await proofsApi.setAll(allProofs);
                  await proofsByMintApi.setAllForMint(allProofs, transaction.mintUrl);
                  console.log('Saved proofs to database');
                }

                // Now update the invoice
                if (typeof invoicesApi !== 'undefined') {
                  // Generate a random ID if one doesn't exist
                  const id = transaction.id || `invoice_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

                  // Create invoice object with all required fields
                  const invoiceToUpdate = {
                    id: transaction.id || `invoice-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
                    state: 'PAID',
                    paid: true,
                    amount: transaction.amount || 0,
                    unit: transaction.unit || 'sat',
                    mint: transaction.mintUrl || walletData.activeMint,
                    date: transaction.date || new Date().toISOString(),
                    bolt11: transaction.invoice || '',
                    quote: transaction.quote || '',
                    request: transaction.invoice || transaction.id || ''
                  };

                  // First check if this invoice exists
                  const existingInvoice = await invoicesApi.get(id);

                  if (existingInvoice) {
                    // Update existing invoice
                    await invoicesApi.update(invoiceToUpdate);
                    console.log('Updated existing invoice status in database');
                  } else {
                    // Add as new invoice
                    await invoicesApi.add(invoiceToUpdate);
                    console.log('Added new invoice to database');
                  }
                } else {
                  // Fall back to creating a token if database APIs unavailable
                  console.log('Using legacy storage for proofs');
                  let encodedToken;

                  if (wallet.encodeProofs) {
                    encodedToken = await wallet.encodeProofs(proofs);
                  } else {
                    const token = {
                      mint: transaction.mintUrl,
                      proofs: proofs,
                      unit: 'sat'
                    };
                    encodedToken = JSON.stringify(token);
                  }

                  if (encodedToken) {
                    console.log('Adding token to storage');
                    addToken(
                      encodedToken,
                      transaction.amount,
                      transaction.mintUrl
                    );
                  }
                }
              } catch (storageErr) {
                console.error('Error saving proofs to storage:', storageErr);
              }

              // Create the payment receipt transaction
              const paymentReceipt = {
                id: uuidv4(),
                type: 'received' as const,
                amount: transaction.amount,
                date: new Date().toISOString(),
                memo: 'Received from Lightning payment',
                mintUrl: transaction.mintUrl,
                status: 'paid' as const,
                description: 'Lightning payment received',
                invoiceType: 'lightning' as const,
                invoice: transaction.invoice
              };

              // Add to our transactions list
              const newTransactions = [...updatedTransactions, paymentReceipt];
              console.log('Created transaction receipt');

              // Update balance immediately
              setBalance(newBalance);

              // Update wallet data with new balance and transactions
              const newWalletData = {
                ...walletData,
                transactions: newTransactions,
                balance: newBalance
              };
              setWalletData(newWalletData);

              // Save updated data
              saveWalletData(newWalletData);

              return { paid: true, amount };
            } else {
              console.warn('No proofs returned from mint');
            }
          }

          // Update wallet balance if supported
          if (typeof wallet.updateBalance === 'function') {
            await wallet.updateBalance();
            console.log('Updated wallet balance after payment');
          }
        } catch (proofsErr) {
          console.error('Error retrieving proofs from mint:', proofsErr);
          // Don't throw - continue with the balance update
        }

        // Update balance immediately even if proof retrieval fails
        setBalance(newBalance);

        // Update wallet data with new balance
        const newWalletData = {
          ...walletData,
          transactions: updatedTransactions,
          balance: newBalance
        };
        setWalletData(newWalletData);

        // Save updated data
        saveWalletData(newWalletData);

        return { paid: true, amount };
      } else {
        // Mark transaction as still pending
        const updatedTransactions = walletData.transactions.map(tx => {
          if (tx.id === transaction.id) {
            return {
              ...tx,
              status: 'pending' as const
            };
          }
          return tx;
        });

        console.log(`Payment not yet confirmed for hash/quote: ${quoteToCheck}`);

        // Save updated data with no balance change
        saveWalletData({
          ...walletData,
          transactions: updatedTransactions
        });

        return { paid: false, amount: 0 };
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  };

  // Send tokens (create a token for sending)
  const createSendToken = useCallback(async (amount: number) => {
    if (!isInitialized) throw new Error('Cashu not initialized');
    if (!walletData.activeMint) throw new Error('No active mint selected');

    try {
      console.log("amount", amount)
      console.log("walletData.balance", walletData.balance)
      if (amount > walletData.balance) {
        throw new Error('Insufficient balance');
      }

      console.log(`Creating ecash token for ${amount} sats from mint: ${walletData.activeMint}`);

      // First get a verified wallet connection
      const readinessCheck = await checkWalletReadiness(walletData.activeMint);
      if (!readinessCheck.ready) {
        throw new Error(`Wallet not ready: ${readinessCheck.error}`);
      }

      // We have a verified wallet connection
      const { wallet } = readinessCheck;

      if (!wallet) {
        throw new Error('Wallet not properly initialized');
      }

      // Get available spendable proofs for this mint
      let proofs = [];
      if (typeof proofsApi !== 'undefined' && typeof proofsByMintApi !== 'undefined') {
        // Get proofs from the new storage structure
        proofs = await proofsByMintApi.getByMintUrl(walletData.activeMint);
        console.log(`Found ${proofs.length} proofs for mint ${walletData.activeMint}`);

        // Filter out any proofs that might be in the spent proofs collection
        const spentProofs = await proofsSpentsByMintApi.getByMintUrl(walletData.activeMint);
        const spentProofIds = new Set(spentProofs.map(p => p.C));

        proofs = proofs.filter(proof => !spentProofIds.has(proof.C));
        console.log(`After filtering spent proofs: ${proofs.length} proofs remaining`);
      }

      // If we have direct access to proofs, use them directly
      if (proofs.length > 0) {
        console.log('Using proofs from database to create send token');

        // Ensure proofs are properly formatted before selecting
        const validProofs = proofs.filter(proof =>
          proof &&
          typeof proof === 'object' &&
          proof.C &&
          proof.secret
        );

        if (validProofs.length === 0) {
          console.error('No valid proofs found in database');
          throw new Error('No valid proofs available to send. Please receive some tokens first.');
        }

        console.log('Valid proofs:', validProofs);
        console.log(`Found ${validProofs.length} valid proofs out of ${proofs.length} total`);

        // Get the fee for sending tokens
        let fee = 1;
        try {
          // Check if the wallet has a getFee method
          if (wallet.getFee) {
            fee = await wallet.getFee(amount);
            console.log(`Fee for sending ${amount} sats: ${fee} sats`);
          } else {
            console.log('Wallet does not support fee calculation');
          }
        } catch (feeError) {
          console.warn('Error calculating fee:', feeError);
          // Continue with fee = 1 if there's an error
        }
        console.log('Fee:', fee);
        const totalAmount = amount + fee;

        // Select proofs to send the requested amount
        const { send: proofsToSend, returnChange: changeProofs } = await wallet.selectProofsToSend(validProofs, totalAmount);
        console.log('Proofs to send:', proofsToSend);
        console.log('Change proofs:', changeProofs);

        if (!proofsToSend || proofsToSend.length === 0) {
          console.error('No suitable proofs available to send');
          throw new Error('No suitable proofs available to send. Please receive some tokens first.');
        }

        // Create a send token with the selected proofs
        let tokenResMelt;
        let token;
        try {
          // If the wallet's send method requires changeProofs but they're undefined,
          // try the alternate approach with null change proofs
          if (changeProofs === undefined || changeProofs.length === 0) {
            console.log('Change proofs undefined, trying alternate send approach');
            // Try various approaches that Cashu wallets might implement
            if (typeof wallet.sendWithoutChange === 'function') {
              tokenResMelt = await wallet.send(amount, proofsToSend);
            } else {
              tokenResMelt = await wallet.send(amount, proofsToSend);
            }
          } else {
            // Normal case with proper change proofs
            tokenResMelt = await wallet.send(amount, proofsToSend);
          }
        } catch (sendError) {
          console.error('Error in wallet.send:', sendError);
          // Fallback to the simplest form as last resort
          console.log('Trying simple send as fallback');
          tokenResMelt = await wallet.send(amount, proofsToSend);
        }

        if (!tokenResMelt) {
          throw new Error('Failed to create send token');
        }

        // Create token record
        const tokenStr = getEncodedTokenV4({ mint: walletData.activeMint, proofs: proofsToSend });
        console.log("Generated token:", tokenStr);

        // Calculate new balance immediately
        const newBalance = walletData.balance - amount;
        console.log(`Updating balance from ${walletData.balance} to ${newBalance}`);

        // Update balance immediately
        setBalance(newBalance);


        // try {
        //   let tx:Transaction = {
        //     id: uuidv4(),
        //     type: 'sent',
        //     amount: amount,
        //     memo: 'Sent ecash',
        //     token: tokenStr,
        //     mintUrl: walletData.activeMint,
        //   }
        //   await transactionsApi.add(tx);

        // } catch (error) {

        // }

        try {
          // Use the SDK to generate the sent transaction
          console.log(`Created send token for ${amount} sats`);
          addTransaction(
            'sent',
            amount,
            'Sent ecash',
            tokenStr, // Save the token string in the transaction
            tokenStr,
            walletData.activeMint,
            'paid' as const,
            'Created ecash token to send',
            undefined, // invoiceType
            tokenStr, // invoice
            tokenStr, // quote
            // proofsToSend // Save the proofs in the transaction
          );
        } catch (error) {
          console.error('Error saving transaction:', error);
          // throw new Error('Failed to save transaction. Please try again.');
        }

        // Move spent proofs to spent proofs collection BEFORE claiming change
        try {
          if (typeof proofsSpentsApi !== 'undefined' && typeof proofsSpentsByMintApi !== 'undefined') {
            await proofsSpentsApi.updateMany(proofsToSend);
            await proofsSpentsByMintApi.addProofsForMint(proofsToSend, walletData.activeMint);

            const proofPresent = await proofsByMintApi.getByMintUrl(walletData.activeMint);

            const proofPresentCleared = proofPresent.filter(p => !proofsToSend.some(pt => pt.C === p.C));
            await proofsByMintApi.setAllForMint([...proofPresentCleared], walletData.activeMint);
            // Remove from active proofs
            const spentIds = proofsToSend.map(p => p.C);
            if (spentIds.length > 0) {
              for (const id of spentIds) {
                await proofsApi.delete(id);
              }
            }
          }
        } catch (error) {
          console.error('Error moving spent proofs to spent proofs collection:', error);
          throw new Error('Failed to update proof status. Please try again.');
        }

        // Claim the change if we have change proofs
        try {
          if (changeProofs && changeProofs.length > 0) {
            console.log(`Claiming ${changeProofs.length} change proofs after creating token`);
            await wallet.addProofs(changeProofs);

            // Update the available proofs
            if (typeof proofsApi !== 'undefined') {
              await proofsApi.setAll(changeProofs);
              await proofsByMintApi.addProofsForMint(changeProofs, walletData.activeMint);
            }
          }
        } catch (error) {
          console.error('Error claiming change proofs:', error);
          // Don't throw here as the main operation succeeded
        }

        // Update wallet data with new balance
        const newWalletData = {
          ...walletData,
          balance: newBalance
        };
        setWalletData(newWalletData);

        // Save to storage
        saveWalletData(newWalletData);

        return {
          amount,
          token: tokenStr,
          ecash: tokenStr,
          mint: walletData.activeMint,
          tokenResMelt: tokenResMelt,
          proofs: proofsToSend // Include proofs in the return value
        };
      } else {
        throw new Error('No proofs available to send. Please receive some tokens first.');
      }
    } catch (err) {
      console.error('Error creating send token:', err);
      setError(err instanceof Error ? err.message : 'Failed to create token');
      throw err;
    }
  }, [isInitialized, walletData.activeMint, walletData.balance, checkWalletReadiness, addTransaction]);

  const decodeInvoiceAmount = (invoice: string) => {

    // Get invoice amount from the Lightning invoice
    // Decode the Lightning invoice to get the amount
    const decodedInvoice = invoice.match(/lnbc(\d+)n/);
    const amount = decodedInvoice ? Number(decodedInvoice[1]) / 10 : 0;
    console.log(`Decoded invoice amount: ${amount} sats`);

    return amount;
  }

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

      // Get invoice amount from the Lightning invoice
      // Decode the Lightning invoice to get the amount
      const decodedInvoice = invoice.match(/lnbc(\d+)n/);
      const amount = decodedInvoice ? Number(decodedInvoice[1]) / 10 : 0;
      console.log(`Decoded invoice amount: ${amount} sats`);

      let fees = await sdkCashu?.wallet?.getFeesForKeyset(amount, sdkCashu.activeUnit);
      console.log("fees", fees);

      const totalAmount = amount + (fees > 0 ? fees : 1); // Include fees in total amount

      console.log("totalAmount", totalAmount)
      console.log("walletData.balance", walletData.balance)
      if (totalAmount > walletData.balance) {
        throw new Error('Insufficient balance');
      }

      const wallet = sdkCashu?.wallet;
      const proofs = await proofsByMintApi.getByMintUrl(walletData.activeMint);

      if (!proofs || proofs.length === 0) {
        throw new Error('No proofs available for payment');
      }

      // Select proofs for payment and cast the response to our expected type
      const res = await wallet?.selectProofsToSend(proofs, totalAmount) as ProofsSelectionResponse;
      if (!res || !res.send || res.send.length === 0) {
        throw new Error('Could not select appropriate proofs for payment');
      }

      const proofsToSend = res.send;
      const proofsToKeep = res.change || []; // Using change property from SDK response

      console.log("proofsToSend", proofsToSend)
      console.log("proofsToKeep", proofsToKeep)
      console.log('Proofs selected for payment:', proofsToSend.length);
      console.log('Change proofs:', proofsToKeep.length);

      try {
        // Attempt to melt the tokens
        const response = await meltTokens(invoice, proofsToSend);
        if (!response) {
          throw new Error('Failed to melt tokens for payment');
        }

        // Payment successful - update storage
        try {
          // 1. Move spent proofs to spent proofs collection
          await proofsSpentsApi.updateMany(proofsToSend);
          await proofsSpentsByMintApi.addProofsForMint(proofsToSend, walletData.activeMint);

          // 2. Remove spent proofs from active proofs
          const spentIds = proofsToSend.map(p => p.C);
          for (const id of spentIds) {
            await proofsApi.delete(id);
          }

          // 3. Update active proofs with change proofs if any
          if (proofsToKeep.length > 0) {
            await proofsApi.setAll(proofsToKeep);
            await proofsByMintApi.setAllForMint(proofsToKeep, walletData.activeMint);
          }

          // 4. Update balance
          const newBalance = walletData.balance - totalAmount;
          saveWalletData({
            ...walletData,
            balance: newBalance
          });

          // 5. Record transaction
          addTransaction(
            'sent',
            amount,
            `Lightning invoice: ${invoice.substring(0, 10)}...`,
            null,
            null,
            walletData.activeMint,
            'paid',
            'Lightning payment sent'
          );

          return {
            success: true,
            amount,
            response
          };
        } catch (storageErr) {
          console.error('Error updating storage after payment:', storageErr);
          // Even if storage update fails, payment was successful
          // We should still return success but log the error
          return {
            success: true,
            amount,
            response,
            storageError: storageErr instanceof Error ? storageErr.message : 'Failed to update storage'
          };
        }
      } catch (meltError) {
        // Check if this is a "Token already spent" error
        if (meltError instanceof Error && meltError.message.includes('Token already spent')) {
          console.log('Detected spent token error, cleaning up proofs...');

          try {
            // 1. Move the spent proofs to spent proofs collection
            await proofsSpentsApi.updateMany(proofsToSend);
            await proofsSpentsByMintApi.addProofsForMint(proofsToSend, walletData.activeMint);

            // 2. Remove the spent proofs from active proofs
            const spentIds = proofsToSend.map(p => p.C);
            for (const id of spentIds) {
              await proofsApi.delete(id);
            }

            // 3. Update active proofs with change proofs if any
            if (proofsToKeep.length > 0) {
              await proofsApi.setAll(proofsToKeep);
              await proofsByMintApi.setAllForMint(proofsToKeep, walletData.activeMint);
            }

            // 4. Recalculate balance based on remaining proofs
            const remainingProofs = await proofsByMintApi.getByMintUrl(walletData.activeMint);
            // const newBalance = remainingProofs.reduce((sum, proof) => sum + (proof.amount || 0), 0);

            // // 5. Update wallet data with new balance
            // saveWalletData({
            //   ...walletData,
            //   balance: newBalance
            // });

            // 6. Record the error transaction
            addTransaction(
              'sent',
              amount,
              `Failed payment - Token already spent`,
              null,
              null,
              walletData.activeMint,
              'failed',
              'Token was already spent'
            );

            throw new Error('Token was already spent. Balance has been updated.');
          } catch (cleanupError) {
            console.error('Error cleaning up spent proofs:', cleanupError);
            throw new Error('Failed to clean up spent proofs. Please try again.');
          }
        }
        // If it's not a spent token error, rethrow the original error
        throw meltError;
      }
    } catch (err) {
      console.error('Error paying Lightning invoice:', err);
      throw err;
    }
  };

  // Get wallet data from storage
  const getWalletData = async (): Promise<typeof walletData> => {
    try {
      // Attempt to get wallet data from storage
      const storedData = await settingsApi.get('WALLET_DATA', '');
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          return parsed as typeof walletData;
        } catch (err) {
          console.error('Error parsing stored wallet data:', err);
        }
      }

      // Return default wallet data if none found or parse error
      return {
        mints: walletData.mints || [],
        activeMint: walletData.activeMint || '',
        activeUnit: walletData.activeUnit || 'sat',
        balance: walletData.balance || 0,
        transactions: walletData.transactions || [],
        tokens: walletData.tokens || []
      };
    } catch (err) {
      console.error('Error getting wallet data from storage:', err);
      // Return current state as fallback
      return { ...walletData };
    }
  };

  // Initialize wallet
  async function initializeWallet() {
    try {
      // Check if we need to migrate from old storage
      await migrateFromLegacyStorage();

      // Get or create wallet ID
      const walletId = await getOrCreateWalletId();
      console.log('Using wallet ID:', walletId);

      // Initialize Cashu SDK - this replaces the old localStorage approach
      console.log('Initializing Cashu SDK');

      // Restore wallet data from storage
      const data = await getWalletData();
      console.log('Loaded wallet data');

      // Check if we have a default mint
      if (data.mints.length === 0) {
        // Add a default mint
        console.log('No mints found, adding default mint');
        const defaultMintUrl = 'https://mint.cubabitcoin.org';
        const defaultMintAlias = 'Default Mint (cubabitcoin)';

        try {
          await addMint(defaultMintUrl, defaultMintAlias);
        } catch (err) {
          console.error('Error adding default mint:', err);
          // Continue even if default mint fails
        }
      }

      // Set balance based on the proofs we have
      // ... rest of the function
      // ... existing code ...
    } catch (err) {
      console.error('Error initializing wallet:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize wallet');
      throw err;
    }
  }

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
    decodeInvoiceAmount,
    setBalance,
    calculateBalanceFromProofs
  };
} 