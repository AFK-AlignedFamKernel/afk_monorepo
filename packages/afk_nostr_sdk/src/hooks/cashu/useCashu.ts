import {
  CashuMint,
  CashuWallet,
  CheckStateEnum,
  getDecodedToken,
  getEncodedToken,
  GetInfoResponse,
  MeltProofsResponse,
  MeltQuoteResponse,
  MintActiveKeys,
  MintAllKeysets,
  MintKeys,
  MintKeyset,
  MintQuoteResponse,
  Proof,
  ProofState,
  getEncodedTokenV4, 
  getEncodedTokenBinary,
  getDecodedTokenBinary,
  
} from '@cashu/cashu-ts';
import { bytesToHex } from '@noble/curves/abstract/utils';
import { NDKCashuDeposit } from '@nostr-dev-kit/ndk-wallet';
import * as Bip39 from 'bip39';
import { useEffect, useMemo, useState } from 'react';
import { getProofs as getProofsStorage, storeProofs as storeProofsStorage } from '../../storage';
import { useNostrContext } from '../../context';
import { useAuth, useCashuStore } from '../../store';
import { generateMnemonic } from 'bip39';
import { MintData } from '../../types';
import { NDKCashuToken } from '@nostr-dev-kit/ndk';

export interface ICashu {
  wallet: CashuWallet;
  mint: CashuMint;
  activeMintIndex?: number;
  generateNewMnemonic: () => string;
  derivedSeedFromMnenomicAndSaved: (mnemonic: string) => Uint8Array;
  connectCashMint: (mintUrl: string) => Promise<{
    mint: CashuMint;
    keys: MintKeys[];
  }>;
  connectCashWallet: (cashuMint: CashuMint, keys?: MintKeys | MintKeys[]) => Promise<CashuWallet>;
  initializeWithNostrSeed: (cashuMint: CashuMint, keys?: MintKeys | MintKeys[]) => Promise<CashuWallet>;
  requestMintQuote: (nb: number) => Promise<{
    request: MintQuoteResponse;
  }>;
  mintTokens: (amount: number, quote: MintQuoteResponse) => Promise<Proof[]>;
  payLnInvoice: (
    amount: number,
    request: MintQuoteResponse,
    proofs: Proof[],
  ) => Promise<{
    payRes: MeltProofsResponse;
    sentProofsSpent: ProofState[];
    returnChangeSpent: ProofState[];
  }>;
  sendP2PK: (
    amount: number,
    tokensProofs: Proof[],
    pubkeyRecipient: Uint8Array,
    mintUrl: string,
  ) => Promise<{
    send: Proof[];
    encoded: string;
  }>;
  receiveP2PK: (encoded: string) => Promise<Proof[]>;
  meltTokens: (
    invoice: string,
    pProofs: Proof[],
  ) => Promise<{
    meltQuote: MeltQuoteResponse;
    meltResponse: MeltProofsResponse;
    proofsToKeep: Proof[];
    remainingProofs: Proof[];
    selectedProofs: Proof[];
  }>;
  getKeySets: () => Promise<MintAllKeysets>;
  getUnits: (url: string) => Promise<string[]>;
  getUnitKeysets: (unit: string, pMint: MintData) => Promise<MintKeyset[]>;
  getUnitProofs: (unit: string, pMint: MintData, proofsLocal: Proof[]) => Promise<Proof[]>;
  getUnitBalance: (unit: string, pMint: MintData, proofs: Proof[]) => Promise<number>;
  getKeys: () => Promise<MintActiveKeys>;
  getProofs: (tokens: NDKCashuToken[]) => Promise<Proof[]>;
  getFeesForExternalInvoice: (externalInvoice: string) => Promise<number>;
  payExternalInvoice: (
    amount: number,
    fee: number,
    externalInvoice: string,
    request: MintQuoteResponse,
    proofs: Proof[],
  ) => Promise<{
    payRes: MeltProofsResponse;
    sentProofsSpent: ProofState[];
    returnChangeSpent: ProofState[];
  }>;
  getProofsSpents: (proofs: Proof[]) => Promise<ProofState[]>;
  checkMeltQuote: (quote: string) => Promise<MeltQuoteResponse>;
  checkMintQuote: (quote: string) => Promise<MintQuoteResponse>;
  checkProofSpent: (proofs: { secret: string }[]) => Promise<ProofState[]>;
  receiveEcash: (ecash: string) => Promise<Proof[]>;
  handleReceivedPayment: (amount: number, quote: MintQuoteResponse) => Promise<Proof[]>;
  mints: MintData[];
  setMints: React.Dispatch<React.SetStateAction<MintData[]>>;
  activeMint: string;
  setActiveMint: React.Dispatch<React.SetStateAction<string>>;
  activeUnit: string;
  setActiveUnit: React.Dispatch<React.SetStateAction<string>>;
  proofs: Proof[];
  setProofs: React.Dispatch<React.SetStateAction<Proof[]>>;
  buildMintData: (url: string, alias: string) => Promise<MintData>;
  mintUrls?: MintData[];
  // activeMintIndex?: number;
  setActiveMintIndex: React.Dispatch<React.SetStateAction<number>>;
  setMintUrls?: React.Dispatch<React.SetStateAction<MintData[]>>;
  activeCurrency?: string;
  setActiveCurrency: React.Dispatch<React.SetStateAction<string>>;
  getMintInfo: (mintUrl: string) => Promise<GetInfoResponse>;
  setMintInfo: React.Dispatch<React.SetStateAction<GetInfoResponse>>;
  mintUrlSelected: string;
  setMintUrlSelected: React.Dispatch<React.SetStateAction<string>>;
  setWalletConnected: React.Dispatch<React.SetStateAction<CashuWallet | undefined>>;
  walletConnected: CashuWallet | undefined;
  getUnitBalanceWithProofsChecked: (unit: string, pMint: MintData, proofs: Proof[]) => Promise<number>;
  handleWebsocketProofs: (mergedProofsParents?: Proof[]) => Promise<void>;
  filteredProofsSpents: (proofs: Proof[]) => Promise<{ proofsFiltered: Proof[], proofsSpents: Proof[] }>;

}


export const useCashu = () => {
  const { ndkCashuWallet } = useNostrContext();
  const { privateKey } = useAuth();
  const { setSeed, seed, setMnemonic } = useCashuStore();


  const [isWebsocketProofs, setIsWebsocketProofs] = useState<boolean>(false);

  const [mintUrlSelected, setMintUrlSelected] = useState<string>("https://mint.cubabitcoin.org");

  const [activeMint, setActiveMint] = useState<string>("https://mint.cubabitcoin.org");
  // const [activeMint, setActiveMint] = useState<string>("https://mint.minibits.cash/Bitcoin");
  const [activeMintIndex, setActiveMintIndex] = useState<number>(0);
  const [activeUnit, setActiveUnit] = useState<string>();
  const [activeCurrency, setActiveCurrency] = useState<string>();
  const [mints, setMints] = useState<MintData[]>();
  const [mintUrls, setMintUrls] = useState<MintData[]>([]);
  const [mintsUrlsString, setMintsUrlsString] = useState<string[]>(['https://mint.cubabitcoin.org']);

  const [proofs, setProofs] = useState<Proof[]>([]);
  const [mintInfo, setMintInfo] = useState<GetInfoResponse | undefined>();

  const mint = useMemo(() => {
    // console.log('activeMint', activeMint);
    if (activeMint) return new CashuMint(activeMint);
    if (!activeMint && mintUrls && activeMintIndex) {
      return new CashuMint(mintUrls[activeMintIndex]?.url);
    }
    if (!activeMint && !mintUrls && !activeMintIndex) {
      return new CashuMint(mintUrls[0]?.url);
    }
  }, [activeMint, mintUrls, activeMintIndex]);


  useEffect(() => {
    (async () => {
      if (!activeMintIndex) return;
      const mintUrl = mintUrls?.[activeMintIndex]?.url;
      if (!mintUrl) return;
      const info = await getMintInfo(mintUrl);
      setMintInfo(info);
    })();
  }, [activeMintIndex]);


  // Initialize without immediate state update that triggers renders
  const [walletConnected, setWalletConnected] = useState<CashuWallet | undefined>(undefined);


  const initializeWallet = async () => {
    try {
      console.log('Initializing wallet with mint:', mint.mintUrl);


      let mintInstance = mint;

      if (!mint) {
        mintInstance = new CashuMint(activeMint);
      }

      if (!mintInstance) {
        return;
      }
      // Create new wallet instance
      const newWallet = new CashuWallet(mintInstance, {
        bip39seed: seed,
        unit: activeUnit || 'sat',
      });

      console.log('Wallet created, setting as walletConnected');
      setWalletConnected(newWallet);

      // Try to preload keys to ensure wallet is fully initialized
      try {
        console.log('Preloading mint keys and keysets');
        const keysets = await mint.getKeys();
        const keys = await mint.getKeySets();
      } catch (keysErr) {
        console.error('Error preloading keys (non-critical):', keysErr);
        // Continue anyway - wallet can still work
      }
      return newWallet;
    } catch (err) {
      console.error('Error initializing wallet:', err);
      return undefined;
    }
  };
  // Initialize wallet in useEffect instead
  useEffect(() => {
    if (!mint) {
      console.log('No mint available for wallet initialization');
      return;
    }
    // Only initialize if we don't already have a wallet or if mint has changed
    if (!walletConnected || (walletConnected && walletConnected.mint.mintUrl !== mint.mintUrl)) {
      initializeWallet();
    }
  }, [mint, seed, activeUnit, walletConnected]);


  const [keysetsMint, setKeysetsMint] = useState<MintKeyset[]>([]);
  const [keysMint, setKeysMint] = useState<MintKeys[]>([]);

  // Move state updates to useEffect
  useEffect(() => {
    if (!mint) return;

    (async () => {
      try {
        console.log('Fetching keysets and keys for mint:', mint.mintUrl);
        const keysets = await mint.getKeySets();
        const keys = await mint.getKeys();
        setKeysetsMint(keysets?.keysets || []);
        setKeysMint(keys?.keysets || []);
      } catch (err) {
        console.error('Error getting keysets/keys:', err);
      }
    })();
  }, [mint]);

  const wallet = useMemo(() => {
    if (walletConnected) return walletConnected;
    return undefined;
  }, [walletConnected]);

  // Fix the circular dependency that causes infinite loop
  useEffect(() => {
    // Only set activeMint from mint if needed
    if (mint && (!activeMint || activeMint !== mint.mintUrl)) {
      setActiveMint(mint.mintUrl);
    }
  }, [mint, activeMint]);

  // Separate effect for mintUrls to avoid conflicts
  useEffect(() => {
    // Only update from mintUrls if we have a valid index
    if (mintUrls && mintUrls.length > 0 && activeMintIndex >= 0 && activeMintIndex < mintUrls.length) {
      const newMintUrl = mintUrls[activeMintIndex].url;
      // Only update if different from current
      if (newMintUrl && newMintUrl !== activeMint) {
        setActiveMint(newMintUrl);
      }
    }
  }, [mintUrls, activeMintIndex, activeMint]);

  /** TODO saved in secure store */
  const generateNewMnemonic = () => {
    try {
      const mn = Bip39.generateMnemonic(128, undefined, Bip39.wordlists['english']);
      setMnemonic(mn);
      return mn;
    } catch (e) {
      console.error(e);
      return '';
    }
  };
  /** TODO saved in secure store */
  const derivedSeedFromMnenomicAndSaved = (mnemonic: string) => {
    const seedDerived = Bip39.mnemonicToSeedSync(mnemonic);
    setSeed(seedDerived);
    return seedDerived;
  };



  const handleWebsocketProofs = async (mergedProofsParents?: Proof[]) => {
    try {
      console.log("handleWebsocketProofs")
      if (!wallet) {
        console.log("handleWebsocketProofs wallet not found")
        return;
      }

      let mergedProofs = mergedProofsParents;

      console.log("handleWebsocketProofs mergedProofs", mergedProofs)
      // storeProofs(mergedProofs);
      const data = await new Promise<ProofState>((res) => {
        try {
          if (wallet) {
            wallet?.onProofStateUpdates(
              mergedProofs,
              (p) => {
                if (p.state === CheckStateEnum.SPENT) {
                  res(p);
                  const proofsStr = getProofsStorage();
                  const proofs = JSON.parse(proofsStr);
                  // console.log("onProofStateUpdates proofs", proofs)
                  console.log("onProofStateUpdates mergedProofs", mergedProofs)
                  let proofsFiltered = mergedProofs.filter((proof: Proof) => proof.C !== p?.proof?.C);


                  proofsFiltered = Array.from(new Set(proofsFiltered.map((p) => p)));
                  console.log("data onProofStateUpdates proofsFiltered", proofsFiltered)

                  // TODO create spending event
                  // update tokens events
                  // update storage proofs
                  // console.log("proofsFiltered", proofsFiltered)
                  storeProofsStorage([...proofsFiltered]);
                  // setProofsStore([...proofsFiltered]);
                }
              },
              (e) => {
                console.log(e);
              }
            );
            // wallet.swap(21, proofs);
          }
        } catch (error) {
          console.log("error websocket connection", error)

        }


      });
      setIsWebsocketProofs(true);
      console.log("data onProofStateUpdates proofs websocket", data)

    } catch (error) {
      console.log("handleWebsocketProofs errror", error)
    }

  }


  const filteredProofsSpents = async (proofs: Proof[]) => {
    try {
      let proofsFiltered: Proof[] = [];
      let proofsSpents: Proof[] = [];
      if (wallet) {

        for (let i = 0; i < proofs.length; i++) {
          let p = proofs[i]
          console.log("p", p)

          let check = await wallet?.checkProofsStates([p])

          console.log("check", check)
          if (check[0]?.state?.toLowerCase() === CheckStateEnum.SPENT?.toLowerCase() || check[0]?.state?.toLowerCase()?.includes("spent")) {
            console.log("state spent", check[0])
            proofsSpents.push(p);
          } else {
            console.log("state not spent", check[0])
            proofsFiltered.push(p);
          }
        }
        proofs.map(async (p) => {
          console.log("p", p)

          // check.forEach((state) => {
          //   console.log("state", state)
          //   if (state?.state?.toLowerCase() === CheckStateEnum.SPENT?.toLowerCase() || state?.state?.toLowerCase()?.includes("spent")) {
          //     proofsSpents.push(p);
          //   } else {
          //     console.log("state not spent", state)
          //     proofsFiltered.push(p);
          //     return p;
          //   }
          // });

        })

        console.log("proofsFiltered proofs inputs", proofs)
        console.log("proofsSpents proofs inputs", proofsSpents)
      }

      proofsFiltered = proofsFiltered.filter((p: Proof) => {
        if (typeof p !== "undefined" && p?.C) {
          return p;
        }
      })
      console.log("proofsFiltered", proofsFiltered)

      if (proofsFiltered.length === 0) {
        proofsFiltered = proofs;
        return { proofsFiltered, proofsSpents, isSuccessCheck: false };
      }

      return { proofsFiltered, proofsSpents, isSuccessCheck: true };
    } catch (error) {
      console.log("filteredProofsSpents error", error)
      return { proofsFiltered: [], proofsSpents: [], isSuccessCheck: false };
    }


  }

  const connectCashMint = async (mintUrl: string) => {
    const mintCashu = new CashuMint(mintUrl);
    // setMint(mintCashu);

    const keysRes = await mintCashu?.getKeys();
    const keys = keysRes?.keysets;
    console.log('keys', keys);
    // setMintKeys(keys);

    const keyssets = await mintCashu?.getKeySets();
    // setMintAllKeys(keyssets);

    return { mint: mintCashu, keys };
  };


  const getMintInfo = async (mintUrl: string) => {
    const mintCashu = new CashuMint(mintUrl);
    const info = await mintCashu.getInfo();
    setMintInfo(info);
    return info;
  };

  /** 
   * Connect to a Cashu wallet using the provided mint and keys
   * This function initializes a wallet instance for use with the mint
   */
  const connectCashWallet = async (cashuMint: CashuMint, keys?: MintKeys | MintKeys[]) => {
    try {
      if (!cashuMint) {
        console.error('Cannot connect wallet: No mint provided');
        return undefined;
      }

      // Get the mint URL
      const mintUrl = cashuMint.mintUrl;
      console.log(`Connecting wallet to mint: ${mintUrl}`);

      // Set as active mint
      setActiveMint(mintUrl);

      // Get mint keysets if needed
      let mintKeyssets;
      try {
        mintKeyssets = await cashuMint.getKeySets();
        console.log('Got keysets from mint:', mintKeyssets?.keysets?.length);
      } catch (err) {
        console.error('Error getting keysets from mint:', err);
        // Continue without keysets - the wallet can still be created
      }

      // Create wallet instance
      console.log('Creating wallet with seed, unit:', seed ? 'present' : 'not present', activeUnit || 'sat');
      const walletInstance = new CashuWallet(cashuMint, {
        bip39seed: seed,
        unit: activeUnit || 'sat',
        // Use keys if provided
        keys: keys || undefined,
      });

      // Verify the wallet works by testing a basic function
      try {
        console.log('Testing wallet initialization with a basic operation');
        await walletInstance.getKeySets();
        console.log('Wallet initialization test passed');
      } catch (testErr) {
        console.error('Warning: Wallet initialization test failed:', testErr);
        // Continue anyway - some operations may still work
      }

      // Store wallet instance globally for the SDK
      setWalletConnected(walletInstance);
      console.log('Wallet connected successfully');

      return walletInstance;
    } catch (err) {
      console.error('Error connecting to wallet:', err);
      return undefined;
    }
  };

  const getKeys = async () => {
    const keys = await mint?.getKeys();
    return keys;
  };

  const getProofsSpents = async (proofs: Proof[]) => {
    const proofsCheck = await wallet?.checkProofsStates([...proofs]);
    return proofsCheck;
  };

  const getProofs = async (tokens: NDKCashuToken[]) => {
    return []
    // const proofsCheck = await wallet?.checkProofsStates([...tokens]);
    // return proofsCheck;
  };

  const getKeySets = async () => {
    const keyssets = await mint?.getKeySets();
    return keyssets;
  };

  const getUnits = async (url: string) => {
    let units = [];
    const currentMint = new CashuMint(url);
    await currentMint?.getKeySets().then(({ keysets }) => {
      units = keysets
        .map((k) => k.unit)
        .filter((value, index, self) => self.indexOf(value) === index);
    });
    return units;
  };

  const getUnitKeysets = async (unit: string, pMint: MintData): Promise<MintKeyset[]> => {
    const currentMint = new CashuMint(pMint?.url);
    let unitKeysets: MintKeyset[];
    await currentMint?.getKeySets().then(({ keysets }) => {
      unitKeysets = keysets.filter((k) => k?.unit === unit && k?.active);
    });
    return unitKeysets;
  };

  const getUnitProofs = async (
    unit: string,
    pMint: MintData,
    proofsLocal: Proof[],
  ): Promise<Proof[]> => {
    let unitProofs: Proof[] = [];
    if (proofsLocal) {
      await getUnitKeysets(unit, pMint).then((unitKeySets) => {
        unitProofs = proofsLocal.filter((p) => unitKeySets.map((k) => k.id).includes(p.id));
      });
    }
    return unitProofs;
  };

  const getUnitBalance = async (
    unit: string,
    pMint: MintData,
    proofs: Proof[],
  ): Promise<number> => {
    let unitBalance = 0;
    await getUnitProofs(unit, pMint, proofs).then((unitProofs) => {
      unitBalance = unitProofs.reduce((sum, p) => sum + p.amount, 0);
    });
    return unitBalance;
  };

  const getUnitBalanceWithProofsChecked = async (
    unit: string,
    pMint: MintData,
    proofs: Proof[],
  ): Promise<number> => {
    let unitBalance = 0;

    // console.log("getUnitBalanceWithProofsChecked");
    // console.log('proofs', proofs);
    const proofsChecked = await getProofsSpents(proofs);
    // console.log('proofsChecked', proofsChecked);

    const proofsCheck = await wallet?.checkProofsStates(proofs);
    // console.log('proofsCheck', proofsCheck);
    const proofsCheckedFiltered: any[] = proofsCheck.filter((p) => p.state !== CheckStateEnum.SPENT) as any[];
    // console.log('proofsCheckedFiltered', proofsCheckedFiltered);
    await getUnitProofs(unit, pMint, proofsCheckedFiltered).then((unitProofs) => {

      const sameProofs = unitProofs.filter((p) => proofs.map((p2) => p2.id).includes(p.id));
      // FIX TYPE PROOF 
      // Check filter to render whats not spent
      // const sameProofs = proofs.filter((p) => proofsCheckedFiltered.find((p2) => {
      //   // console.log('p2', p2);
      //   // console.log('p', p);
      //   // console.log('p2.Y == p.C', p2.Y === p.C);

      //   if (p2.state === CheckStateEnum.SPENT) return undefined;
      //   return p2.Y == p.C;
      // }));
      // console.log('sameProofs', sameProofs);
      unitBalance = sameProofs.reduce((sum, p) => sum + p.amount, 0);
    });
    return unitBalance;
  };

  // Add a helper function to validate and parse mint responses
  const parseAndValidateMintResponse = (response: any): {
    isValid: boolean;
    invoice?: string;
    paymentHash?: string;
    quoteId?: string;
    quote?: string;
    amount?: number;
    error?: string;
  } => {
    // First check if we have a response
    if (!response) {
      return { isValid: false, error: 'Empty response from mint' };
    }

    // Extract all possible invoice field names
    const invoice = response.request ||
      response.pr ||
      response.bolt11 ||
      response.payment_request ||
      response.invoice ||
      '';

    // Extract all possible payment hash fields
    const paymentHash = response.hash ||
      response.payment_hash ||
      response.id ||
      response.paymentHash ||
      '';

    // Extract quote ID and amount if available
    const quote = response.quote || '';
    const quoteId = response.id || response.quote_id || '';
    const amount = response.amount || response.value || 0;

    // Log the found fields
    console.log('Parsed mint response:', {
      hasInvoice: !!invoice,
      hasPaymentHash: !!paymentHash,
      hasQuote: !!quote,
      hasQuoteId: !!quoteId,
      amount
    });

    // Determine validity - must have at least invoice or payment hash
    const isValid = !!(invoice || paymentHash);

    return {
      isValid,
      invoice,
      paymentHash,
      quoteId,
      quote,
      amount,
      error: isValid ? undefined : 'Invalid mint response format'
    };
  };

  // New method with retry logic for generating mint quotes
  const createMintQuoteWithRetry = async (amount: number, maxAttempts = 3): Promise<MintQuoteResponse> => {
    let lastError: Error | null = null;

    // Get a wallet instance
    const walletInstance = wallet || walletConnected;
    if (!walletInstance) {
      throw new Error('No wallet instance available');
    }

    // Make multiple attempts
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Creating mint quote attempt ${attempt}/${maxAttempts} for ${amount} sats`);

        // Set timeout for this request
        const timeoutMs = 5000 * attempt; // Increase timeout with each attempt

        // Create the quote with timeout
        const quotePromise = walletInstance.createMintQuote(amount);
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Quote request timeout (${timeoutMs}ms)`)), timeoutMs)
        );

        // Race the promises
        const response = await Promise.race([quotePromise, timeoutPromise]);

        // Use our enhanced validation
        const parsed = parseAndValidateMintResponse(response);

        if (!parsed.isValid) {
          console.warn(`Invalid response format (attempt ${attempt}):`, response);
          throw new Error(parsed.error || 'Invalid mint response format');
        }

        // If we got here, we have a valid response
        console.log(`Successful quote generation on attempt ${attempt}`);

        // Ensure the response matches the expected MintQuoteResponse format as best as possible
        const validatedResponse = {
          ...response,
          // Ensure the quote field exists
          quote: (response as any).quote || (response as any).id || (response as any).hash || 'unknown',
          // Add missing fields if needed
          request: parsed.invoice || (response as any).request || '',
          hash: parsed.paymentHash || (response as any).hash || ''
        };

        return validatedResponse as MintQuoteResponse;
      } catch (err) {
        console.error(`Quote generation failed on attempt ${attempt}:`, err);
        lastError = err instanceof Error ? err : new Error(String(err));

        // Don't wait after the final attempt
        if (attempt < maxAttempts) {
          const waitTime = 1000 * attempt;
          console.log(`Waiting ${waitTime}ms before next attempt...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // All attempts failed
    throw lastError || new Error('Failed to generate quote after multiple attempts');
  };

  const requestMintQuote = async (nb: number) => {
    try {
      // Check if either wallet or walletConnected is available
      const walletInstance = wallet || walletConnected;

      if (!walletInstance) {
        console.error('No wallet instance available when attempting to create mint quote');
        throw new Error('Wallet not initialized');
      }

      console.log('Creating mint quote with wallet instance:', walletInstance);

      // Validate the wallet instance has required methods
      if (typeof walletInstance.createMintQuote !== 'function') {
        console.error('Wallet instance missing createMintQuote method:', walletInstance);
        throw new Error('Invalid wallet instance: missing createMintQuote method');
      }

      // Verify mint connection in the wallet
      if (!walletInstance.mint) {
        console.error('Wallet instance has no mint connection');
        throw new Error('Wallet has no mint connection');
      }

      console.log('Using mint URL:', walletInstance.mint.mintUrl);

      // Try to test mint connection
      try {
        const mintInfo = await walletInstance.mint.getInfo();
        console.log('Connected to mint successfully:', mintInfo);
      } catch (mintErr) {
        console.warn('Warning: Could not get mint info:', mintErr);
        // Continue anyway - some operations may still work
      }

      // Use the new retry function with enhanced validation
      console.log(`Calling createMintQuoteWithRetry with amount: ${nb}`);
      let request;

      try {
        request = await createMintQuoteWithRetry(nb);
        console.log('Raw quote response after validation:', request);
      } catch (quoteErr) {
        console.error('Error in createMintQuoteWithRetry:', quoteErr);
        throw quoteErr;
      }

      // Perform a final validation check
      const finalValidation = parseAndValidateMintResponse(request);

      if (!finalValidation.isValid) {
        console.error('Final validation check failed:', finalValidation.error);
        throw new Error(finalValidation.error || 'Invalid quote response from mint');
      }

      // Try to check the mint quote but don't fail if this fails
      try {
        if (request.quote) {
          await walletInstance.checkMintQuote(request.quote);
          console.log('Mint quote check successful');
        } else {
          console.warn('Cannot check mint quote: missing quote field');
        }
      } catch (checkErr) {
        console.error('Error checking mint quote:', checkErr);
        // Continue even if checking fails
      }

      return {
        request,
      };
    } catch (e) {
      console.error('MintQuote error:', e);
      throw e; // Re-throw to allow handling in the UI
    }
  };

  const mintTokens = async (amount: number, quote: MintQuoteResponse) => {
    const proofs = await wallet?.mintProofs(amount, quote.quote);
    return proofs;
  };

  const getFeesForExternalInvoice = async (externalInvoice: string) => {
    if (!wallet) return undefined;
    const fee = (await wallet.createMeltQuote(externalInvoice)).fee_reserve;

    return fee;
  };

  const meltTokens = async (invoice: string, pProofs: Proof[]) => {
    try {
      console.log('meltTokens');
      console.log('wallet', wallet);
      let walletInstance = wallet;
      if (!wallet) {
        walletInstance = await initializeWallet();
      };

      if (!walletInstance) {
        console.log('No wallet instance available when attempting to melt tokens');
        throw new Error('Wallet not initialized');
      }

      // let walletToUse = wallet;
      const meltQuote = await walletInstance?.createMeltQuote(invoice);

      console.log('meltQuote', meltQuote);
      const amountToSend = meltQuote.amount + meltQuote.fee_reserve;
      // const amountToSend = meltQuote.amount;
      const totalProofsAvailable = pProofs.reduce((acc, p) => acc + p.amount, 0);
      if (totalProofsAvailable < amountToSend) {
        console.log('totalProofsAvailable < amountToSend', totalProofsAvailable, amountToSend);
        return undefined;
      }

      //selectProofs
      const selectedProofs: Proof[] = [];
      const remainingProofs: Proof[] = [];
      let proofsAmount = 0;
      for (let i = 0; i < pProofs.length; i++) {
        if (proofsAmount >= amountToSend) {
          remainingProofs.push(pProofs[i]);
        } else {
          selectedProofs.push(pProofs[i]);
          proofsAmount += pProofs[i].amount;
        }
      }

      try {
        // in a real wallet, we would coin select the correct amount of proofs from the wallet's storage
        // instead of that, here we swap `proofs` with the mint to get the correct amount of proofs
        const { keep: proofsToKeep, send: proofsToSend } = await walletInstance.send(
          amountToSend,
          selectedProofs,
        );
        const meltResponse = await walletInstance.meltProofs(meltQuote, proofsToSend);

        return { meltQuote, meltResponse, proofsToKeep, remainingProofs, selectedProofs };
      } catch (err) {
        // Check if this is a "Token already spent" error
        if (err instanceof Error && err.message.includes('Token was already spent')) {
          console.log('Token already spent, updating proofs and balance');
          
          // Check which proofs are spent
          const proofsStates = await walletInstance.checkProofsStates(selectedProofs);
          const spentProofs = proofsStates.filter(p => p.state === CheckStateEnum.SPENT);
          
          // Remove spent proofs from storage
          const proofsStr = getProofsStorage();
          const allProofs = JSON.parse(proofsStr);
          const updatedProofs = allProofs.filter((p: Proof) => 
            !spentProofs.some(spent => spent.Y === p.C)
          );
          
          // Store updated proofs
          storeProofsStorage(updatedProofs);
          
          // Update balance
          const newBalance = updatedProofs.reduce((sum: number, p: Proof) => sum + p.amount, 0);
          setProofs(updatedProofs); // This will trigger a balance update through the useCashuBalance hook
          
          // Re-throw the error to be handled by the UI
          throw err;
        }
        throw err;
      }
    } catch (e) {
      console.log('Error meltTokens', e);
      throw e; // Re-throw to be handled by the UI
    }
  };

  const payLnInvoice = async (amount: number, request: MintQuoteResponse, proofs: Proof[]) => {
    if (!wallet) return undefined;

    const quote = await wallet.createMeltQuote(request.request);
    const totalAmount = quote.fee_reserve + amount;
    const { keep, send } = await wallet.send(totalAmount, proofs);
    const payRes = await wallet.meltProofs(quote, send);

    // check states of spent and kept proofs after payment
    const sentProofsSpent = await wallet.checkProofsStates(send);
    // expect that all proofs are spent, i.e. sendProofsSpent == sendResponse.send
    // expect none of the sendResponse.returnChange to be spent
    const returnChangeSpent = await wallet.checkProofsStates(keep);

    return {
      payRes,
      sentProofsSpent,
      returnChangeSpent,
    };
  };

  const sendP2PK = async (
    amount: number,
    tokensProofs: Proof[],
    pubkeyRecipient: Uint8Array,
    mintUrl: string,
  ) => {
    if (!wallet) return undefined;

    const { send } = await wallet.send(amount, tokensProofs, { pubkey: bytesToHex(pubkeyRecipient) });
    const encoded = getEncodedToken({
      mint: mintUrl,
      proofs: send,
    });

    return {
      send,
      encoded,
    };
  };

  const receiveP2PK = async (encoded: string) => {
    if (!wallet) return undefined;

    const privateKeyHex = new Uint8Array(Buffer.from(privateKey, 'utf-8'));

    if (privateKey && privateKey) {
      const proofs = await wallet.receive(encoded, { privkey: bytesToHex(privateKeyHex) });

      return proofs;
    } else {
      const proofs = await wallet.receive(encoded);
      return proofs;
    }
  };

  const payExternalInvoice = async (
    amount: number,
    fee: number,
    externalInvoice: string,
    request: MintQuoteResponse,
    proofs: Proof[],
  ) => {
    if (!wallet) return undefined;

    const quote = await wallet.createMeltQuote(externalInvoice);
    const totalAmount = fee + amount;
    const { keep, send } = await wallet.send(totalAmount, proofs);
    const payRes = await wallet.meltProofs(quote, send);

    // expect that we have not received the fee back, since it was external

    // check states of spent and kept proofs after payment
    const sentProofsSpent = await wallet.checkProofsStates(send);
    // expect that all proofs are spent, i.e. sendProofsSpent == sendResponse.send
    // expect none of the sendResponse.returnChange to be spent
    const returnChangeSpent = await wallet.checkProofsStates(keep);
    return {
      payRes,
      sentProofsSpent,
      returnChangeSpent,
    };
  };

  const checkMeltQuote = async (quote: string) => {
    try {
      if (!wallet) return undefined;
      const checkQuoteMelt = await wallet?.checkMeltQuote(quote);
      return checkQuoteMelt;
    } catch (e) {
      console.log('Error checkMeltQuote', e);
    }
  };

  const checkProofSpent = async (proofs: Proof[]) => {
    try {
      if (!wallet) return undefined;
      const proofsSpents = await wallet.checkProofsStates(proofs);
      return proofsSpents;
    } catch (e) {
      console.log('Error checkProofSpent', e);
    }
  };

  const checkMintQuote = async (quote: string) => {
    try {
      if (!wallet) return undefined;
      const resCheckMintQuote = await wallet.checkMintQuote(quote);
      return resCheckMintQuote;
    } catch (e) {
      console.log('Error checkMintQuote', e);
    }
  };

  const receiveEcash = async (ecash: string) => {
    if (!ecash) {
      return;
    }
    const encoded = getDecodedToken(ecash);
    console.log('encoded', encoded);

    const response = await wallet?.receive(encoded);

    return response;
  };

  const handleReceivedPayment = async (amount: number, quote: MintQuoteResponse) => {
    const mintTokensProofs = await mintTokens(Number(amount), quote);

    const encoded = getEncodedToken({
      mint: mint?.mintUrl,
      proofs: mintTokensProofs,
    });
    const response = await receiveP2PK(encoded);

    return response;
  };

  const buildMintData = async (url: string, alias: string) => {
    const mint = new CashuMint(url);
    const info = await mint.getInfo();
    const keys = await mint.getKeys();
    const keysets = await mint.getKeySets();
    const units = await getUnits(url);
    const mintData: MintData = {
      url,
      alias,
      info,
      keys,
      keysets,
      units,
    };
    return mintData;
  };

  /**
   * Initialize a wallet with Nostr seed if available, otherwise use provided seed
   */
  const initializeWithNostrSeed = async (cashuMint: CashuMint, keys?: MintKeys | MintKeys[]) => {
    try {
      // Check if NostrKeyManager is available
      const NostrKeyManager = await import('../../utils/nostr-key-manager').then(
        m => m.NostrKeyManager
      ).catch(() => null);

      let walletSeed = seed; // Default to current seed
      let usingNostrSeed = false;

      // Try to get Nostr seed if NostrKeyManager is available
      if (NostrKeyManager) {
        try {
          // Use the new utility method
          const nostrSeed = await NostrKeyManager.checkNostrSeedAvailable();
          if (nostrSeed) {
            console.log('Using Nostr seed for Cashu wallet');
            // Convert seed to the format expected by CashuWallet (Uint8Array)
            walletSeed = Buffer.from(nostrSeed, 'hex');

            // Update Cashu store with Nostr seed
            if (walletSeed && walletSeed.length > 0) {
              setSeed(walletSeed);
              usingNostrSeed = true;
            }
          }
        } catch (nostrErr) {
          console.error('Error getting Nostr seed:', nostrErr);
          // Continue with current seed if error occurs
        }
      }

      // Connect wallet with appropriate seed
      return connectCashWallet(cashuMint, keys);
    } catch (err) {
      console.error('Error initializing with Nostr seed:', err);
      // Fall back to regular connection
      return connectCashWallet(cashuMint, keys);
    }
  };

  const decodeInvoiceAmount = (invoice: string) => {

    // Get invoice amount from the Lightning invoice
    // Decode the Lightning invoice to get the amount
    const decodedInvoice = invoice.match(/lnbc(\d+)n/);
    const amount = decodedInvoice ? Number(decodedInvoice[1]) / 10 : 0;
    console.log(`Decoded invoice amount: ${amount} sats`);

    return amount;
  }

  return {
    wallet,
    mint,
    generateNewMnemonic,
    derivedSeedFromMnenomicAndSaved,
    // connectCashMint,
    // connectCashWallet,
    requestMintQuote,
    mintTokens,
    payLnInvoice,
    sendP2PK,
    receiveP2PK,
    meltTokens,
    getKeySets,
    getUnits,
    getUnitKeysets,
    getUnitProofs,
    getUnitBalance,
    getKeys,
    getProofs,
    getFeesForExternalInvoice,
    payExternalInvoice,
    getProofsSpents,
    checkMeltQuote,
    checkMintQuote,
    checkProofSpent,
    receiveEcash,
    handleReceivedPayment,
    mints,
    setMints,
    activeMint,
    setActiveMint,
    activeUnit,
    setActiveUnit,
    proofs,
    setProofs,
    buildMintData,
    activeMintIndex,
    mintUrls,
    connectCashMint,
    connectCashWallet,
    activeCurrency,
    setActiveCurrency,
    setActiveMintIndex,
    setMintUrls,
    getMintInfo,
    setMintInfo,
    setMintUrlSelected,
    mintUrlSelected,
    setWalletConnected,
    walletConnected,
    getUnitBalanceWithProofsChecked,
    handleWebsocketProofs,
    filteredProofsSpents,
    initializeWithNostrSeed,
    getEncodedTokenV4,
    getEncodedTokenBinary,
    getDecodedTokenBinary,
    decodeInvoiceAmount
  };
};
