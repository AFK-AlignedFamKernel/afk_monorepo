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
} from '@cashu/cashu-ts';
import { bytesToHex } from '@noble/curves/abstract/utils';
import { NDKCashuToken } from '@nostr-dev-kit/ndk-wallet';
import * as Bip39 from 'bip39';
import { useEffect, useMemo, useState } from 'react';
import { getProofs as getProofsStorage, storeProofs as storeProofsStorage } from '../../storage';
import { useNostrContext } from '../../context';
import { useAuth, useCashuStore } from '../../store';
import { generateMnemonic } from 'bip39';
import { MintData } from '../../types';

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
  getProofs: (tokens: NDKCashuToken[]) => Promise<void>;
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

export const useCashu = (): ICashu => {
  const { ndkCashuWallet } = useNostrContext();
  const { privateKey } = useAuth();
  const { setSeed, seed, setMnemonic } = useCashuStore();


  const [isWebsocketProofs, setIsWebsocketProofs] = useState<boolean>(false);

  const [mintUrlSelected, setMintUrlSelected] = useState<string>("https://mint.minibits.cash/Bitcoin");

  const [activeMint, setActiveMint] = useState<string>();
  // const [activeMint, setActiveMint] = useState<string>("https://mint.minibits.cash/Bitcoin");
  const [activeMintIndex, setActiveMintIndex] = useState<number>(0);
  const [activeUnit, setActiveUnit] = useState<string>();
  const [activeCurrency, setActiveCurrency] = useState<string>();
  const [mints, setMints] = useState<MintData[]>();
  const [mintUrls, setMintUrls] = useState<MintData[]>([]);
  const [mintsUrlsString, setMintsUrlsString] = useState<string[]>(['https://mint.minibits.cash/Bitcoin']);

  const [proofs, setProofs] = useState<Proof[]>([]);
  const [mintInfo, setMintInfo] = useState<GetInfoResponse | undefined>();

  const mint = useMemo(() => {
    // console.log('activeMint', activeMint);
    if (activeMint) return new CashuMint(activeMint);
    if (!activeMint && mintUrls && activeMintIndex) {
      return new CashuMint(mintUrls[activeMintIndex].url);
    }
    if (!activeMint && !mintUrls && !activeMintIndex) {
      return new CashuMint(mintUrls[0].url);
    }
  }, [activeMint, mintUrls, activeMintIndex, setMintUrlSelected]);

  useEffect(() => {
    (async () => {
      if (!activeMintIndex) return;
      const mintUrl = mintUrls?.[activeMintIndex]?.url;
      if (!mintUrl) return;
      const info = await getMintInfo(mintUrl);
      setMintInfo(info);
    })();
  }, [activeMintIndex]);


  const [walletConnected, setWalletConnected] = useState<CashuWallet | undefined>(new CashuWallet(mint, {
    bip39seed: seed,
    // unit: activeUnit,
    // keysets: keysetsMint,
    // keys: keysMint,
    // keysets: (await keysets).keysets || [],
  }));



  const [keysetsMint, setKeysetsMint] = useState<MintKeyset[]>([]);
  const [keysMint, setKeysMint] = useState<MintKeys[]>([]);
  const keysets = useMemo(async () => {
    const keysets = await mint?.getKeySets();
    const keys = await mint?.getKeys();
    setKeysetsMint(keysets?.keysets || []);
    setKeysMint(keys?.keysets || []);
    return keysets;
  }, [mint, activeUnit, activeMint]);

  const wallet = useMemo(() => {

    let newWallet: CashuWallet | undefined;
    // console.log('keysetsMint', keysetsMint);
    // const keysets = await mint?.getKeySets();
    if (mint) {
      newWallet = new CashuWallet(mint, {
        bip39seed: seed,
        unit: activeUnit,
        // keysets: keysetsMint,
        // keys: keysMint,
        // keysets: (await keysets).keysets || [],
      });
      // setWalletConnected(newWallet);
    }
    if (mint && !seed) {
      newWallet = new CashuWallet(mint, {
        // bip39seed: seed,
        unit: activeUnit,
        // keysets: keysetsMint,
        // keys: keysMint,
        // keysets: (await keysets).keysets || [],
      });
      setWalletConnected(newWallet);
    }
    if (newWallet) return newWallet;
    if (walletConnected) return walletConnected;


  }, [mint, seed, activeUnit, keysetsMint, walletConnected]);

  useEffect(() => {
    if (mint) {
      setActiveMint(mint.mintUrl);
    }

    if (activeMintIndex && mintUrls) {
      setActiveMint(mintUrls[activeMintIndex].url);
    }
  }, [mint, mintUrls, activeMintIndex]);


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

  /** TODO fixed connect cash wallet with mnemonic and keys */
  const connectCashWallet = async (cashuMint: CashuMint, keys?: MintKeys | MintKeys[]) => {
    if (!mint && !cashuMint) return undefined;
    const mnemonic = generateMnemonic(128);
    const mintKeysset = await mint?.getKeySets();
    setActiveMint(cashuMint.mintUrl);
    const wallet = new CashuWallet(cashuMint, {
      bip39seed: seed,
      unit: activeUnit,
      // mnemonicOrSeed: mnemonic,
      // keys:keys
      // keysets: mintKeysset?.keysets || [],
    });
    // setWallet(wallet);
    setWalletConnected(wallet);
    return wallet;
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
    const proofsCheck = await ndkCashuWallet?.checkProofs([...tokens]);
    return proofsCheck;
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

  const requestMintQuote = async (nb: number) => {
    try {
      if (!wallet) return;

      const request = await wallet?.createMintQuote(nb);
      await wallet?.checkMintQuote(request.quote);
      return {
        request,
      };
    } catch (e) {
      console.log('MintQuote error', e);
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
      if (!wallet) return;

      // let walletToUse = wallet;
      const meltQuote = await wallet?.createMeltQuote(invoice);

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

      // in a real wallet, we would coin select the correct amount of proofs from the wallet's storage
      // instead of that, here we swap `proofs` with the mint to get the correct amount of proofs
      const { keep: proofsToKeep, send: proofsToSend } = await wallet.send(
        amountToSend,
        selectedProofs,
        // {
        //   includeFees:true,
        //   // keysetId: (await keysets).keysets[0].id,
        // }
      );
      const meltResponse = await wallet.meltProofs(meltQuote, proofsToSend);

      return { meltQuote, meltResponse, proofsToKeep, remainingProofs, selectedProofs };
    } catch (e) {
      console.log('Error meltTokens', e);
      return undefined;
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
    filteredProofsSpents
  };
};
