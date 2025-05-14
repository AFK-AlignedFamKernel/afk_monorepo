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

  // Initialize SDK with our storage data
  useEffect(() => {
    if (!storageLoading && !loading && isInitialized) {
      // Sync mint data between storage and SDK
      if (walletData.activeMint) {
        sdkCashu.connectCashMint(walletData.activeMint);
      }
    }
  }, [storageLoading, loading, isInitialized, walletData.activeMint, sdkCashu]);

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
      const { mint, keys } = await sdkCashu.connectCashMint(mintUrl);
      
      // Get mint info to determine available units
      const info = await mint.getInfo();
      const units = info?.units || ['sat'];
      
      // Create mint data
      const mintData: MintData = {
        url: mintUrl,
        alias,
        units,
        keys,
      };
      
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
              privkey: seed,
            });
          } catch (err) {
            console.error('Error creating wallet event:', err);
          }
        }
      }
      
      return mintData;
    } catch (err) {
      console.error('Error adding mint:', err);
      setError(err instanceof Error ? err.message : 'Failed to add mint');
      throw err;
    }
  }, [sdkCashu, addMintToStorage, walletData.mints, seed, createWalletEvent]);

  // Set active mint
  const setActiveMint = useCallback(async (mintUrl: string) => {
    try {
      // Verify mint exists in our storage
      const mint = walletData.mints.find(m => m.url === mintUrl);
      if (!mint) {
        throw new Error('Mint not found');
      }
      
      // Connect to mint in SDK
      await sdkCashu.connectCashMint(mintUrl);
      
      // Update local storage
      setActiveMintInStorage(mintUrl);
      
      return true;
    } catch (err) {
      console.error('Error setting active mint:', err);
      setError(err instanceof Error ? err.message : 'Failed to set active mint');
      throw err;
    }
  }, [sdkCashu, walletData.mints, setActiveMintInStorage]);

  // Set active unit
  const setActiveUnit = useCallback((unit: string) => {
    // Update local storage
    setActiveUnitInStorage(unit);
  }, [setActiveUnitInStorage]);

  // Get balance for the active mint/unit
  const getBalance = useCallback(async () => {
    if (!isInitialized || !walletData.activeMint || !walletData.activeUnit) {
      return 0;
    }
    
    try {
      const mintData = walletData.mints.find(m => m.url === walletData.activeMint);
      if (!mintData) {
        return 0;
      }
      
      // Get proofs from Nostr events and local storage
      const proofs = await sdkCashu.getProofs(tokensEvents?.pages?.[0] || []);
      
      // Calculate balance using SDK
      const balance = await sdkCashu.getUnitBalance(
        walletData.activeUnit,
        mintData,
        proofs
      );
      
      return balance;
    } catch (err) {
      console.error('Error getting balance:', err);
      return walletData.balance;
    }
  }, [isInitialized, walletData.activeMint, walletData.activeUnit, walletData.mints, walletData.balance, sdkCashu, tokensEvents]);

  // Create a Lightning invoice
  const createInvoice = useCallback(async (mintUrl: string, amount: number) => {
    if (!isInitialized) throw new Error('Cashu not initialized');

    try {
      // Connect to mint
      const { mint } = await sdkCashu.connectCashMint(mintUrl);
      
      // Request mint quote
      const { request } = await sdkCashu.requestMintQuote(amount);
      
      return {
        invoice: request.pr,
        paymentHash: request.hash,
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
      // Connect to mint
      const { mint } = await sdkCashu.connectCashMint(mintUrl);
      
      // Check status
      const status = await mint.checkMintStatus(paymentHash);
      
      return {
        paid: status.paid,
        amount: status.quote?.amount || 0,
        paymentHash,
      };
    } catch (err) {
      console.error('Error checking invoice status:', err);
      setError(err instanceof Error ? err.message : 'Failed to check invoice status');
      throw err;
    }
  }, [isInitialized, sdkCashu]);

  // Mint tokens after invoice is paid
  const mintTokens = useCallback(async (mintUrl: string, paymentHash: string) => {
    if (!isInitialized) throw new Error('Cashu not initialized');

    try {
      // Connect to mint
      const { mint } = await sdkCashu.connectCashMint(mintUrl);
      
      // Check status
      const status = await mint.checkMintStatus(paymentHash);
      
      if (!status.paid) {
        throw new Error('Invoice not paid yet');
      }
      
      // Mint tokens using the quote
      const proofs = await sdkCashu.mintTokens(status.quote.amount, status.quote);
      
      // Save to Nostr
      if (proofs.length > 0) {
        await createToken({
          mint: mintUrl,
          proofs,
        });
      }
      
      // Record transaction
      addTransaction('received', status.quote.amount, 'Lightning payment', null);
      
      return {
        success: true,
        amount: status.quote.amount,
        proofs,
      };
    } catch (err) {
      console.error('Error minting tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to mint tokens');
      throw err;
    }
  }, [isInitialized, sdkCashu, createToken, addTransaction]);

  // Parse token
  const parseToken = useCallback((token: string) => {
    try {
      if (!token.startsWith('cashu')) {
        throw new Error('Invalid token format');
      }
      
      // Use SDK's token parsing capabilities
      const decoded = sdkCashu.wallet.deserialize(token);
      
      return {
        valid: true,
        amount: decoded.token.reduce((sum, t) => sum + t.proofs.reduce((s, p) => s + p.amount, 0), 0),
        mintUrl: decoded.token[0]?.mint || walletData.activeMint || '',
        token,
      };
    } catch (err) {
      console.error('Error parsing token:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse token');
      throw err;
    }
  }, [sdkCashu.wallet, walletData.activeMint]);

  // Receive token
  const receiveToken = useCallback(async (token: string) => {
    if (!isInitialized) throw new Error('Cashu not initialized');

    try {
      const parsed = parseToken(token);
      
      if (!parsed.valid) {
        throw new Error('Invalid token');
      }
      
      // Receive the token with SDK
      const proofs = await sdkCashu.receiveP2PK(token);
      
      // Save to Nostr
      if (proofs.length > 0) {
        await createToken({
          mint: parsed.mintUrl,
          proofs,
        });
      }
      
      // Record the transaction and token
      addTransaction('received', parsed.amount, 'Ecash token', token);
      addToken(token, parsed.amount, parsed.mintUrl);
      
      return {
        success: true,
        amount: parsed.amount,
        proofs,
      };
    } catch (err) {
      console.error('Error receiving token:', err);
      setError(err instanceof Error ? err.message : 'Failed to receive token');
      throw err;
    }
  }, [isInitialized, parseToken, sdkCashu, createToken, addTransaction, addToken]);

  // Send tokens (create a token for sending)
  const createSendToken = useCallback(async (amount: number) => {
    if (!isInitialized) throw new Error('Cashu not initialized');
    if (!walletData.activeMint) throw new Error('No active mint selected');
    
    try {
      if (amount > walletData.balance) {
        throw new Error('Insufficient balance');
      }
      
      // Get proofs from Nostr events and local storage
      const proofs = await sdkCashu.getProofs(tokensEvents?.pages?.[0] || []);
      
      // Create a token using SDK
      const { send, encoded } = await sdkCashu.sendP2PK(
        amount,
        proofs,
        new Uint8Array(32), // Random recipient for P2PK
        walletData.activeMint
      );
      
      // Mark the used proofs as spent in Nostr
      await deleteTokens({
        proofs,
      });
      
      // Record the transaction
      addTransaction('sent', amount, 'Created send token', encoded);
      
      return {
        success: true,
        token: encoded,
        amount,
      };
    } catch (err) {
      console.error('Error creating send token:', err);
      setError(err instanceof Error ? err.message : 'Failed to create send token');
      throw err;
    }
  }, [isInitialized, walletData.activeMint, walletData.balance, sdkCashu, tokensEvents, deleteTokens, addTransaction]);

  // Pay a Lightning invoice
  const payLightningInvoice = useCallback(async (invoice: string) => {
    if (!isInitialized) throw new Error('Cashu not initialized');
    if (!walletData.activeMint) throw new Error('No active mint selected');
    
    try {
      // Connect to mint
      const { mint } = await sdkCashu.connectCashMint(walletData.activeMint);
      
      // Get quote for the invoice
      const meltQuote = await mint.getMeltQuote(invoice);
      
      // Get proofs from Nostr events and local storage
      const proofs = await sdkCashu.getProofs(tokensEvents?.pages?.[0] || []);
      
      // Check if we have enough balance
      if (meltQuote.amount > walletData.balance) {
        throw new Error('Insufficient balance');
      }
      
      // Melt tokens to pay invoice
      const { meltResponse, selectedProofs } = await sdkCashu.meltTokens(invoice, proofs);
      
      // Mark the used proofs as spent in Nostr
      await deleteTokens({
        proofs: selectedProofs,
      });
      
      // Record transaction
      addTransaction(
        'sent', 
        meltQuote.amount, 
        `Lightning invoice: ${invoice.substring(0, 10)}...`, 
        null
      );
      
      return {
        success: true,
        amount: meltQuote.amount,
        preimage: meltResponse.preimage,
      };
    } catch (err) {
      console.error('Error paying Lightning invoice:', err);
      setError(err instanceof Error ? err.message : 'Failed to pay Lightning invoice');
      throw err;
    }
  }, [isInitialized, walletData.activeMint, walletData.balance, sdkCashu, tokensEvents, deleteTokens, addTransaction]);

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