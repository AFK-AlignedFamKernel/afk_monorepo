import {
  CashuMint,
  CashuWallet,
  getDecodedToken,
  getEncodedToken,
  GetInfoResponse,
  MeltProofsResponse,
  MeltQuoteResponse,
  MintActiveKeys,
  MintAllKeysets,
  MintKeyset,
  MintQuoteResponse,
  Proof,
  ProofState,
} from '@cashu/cashu-ts';
import {bytesToHex} from '@noble/curves/abstract/utils';
import {NDKCashuToken} from '@nostr-dev-kit/ndk-wallet';
import {generateMnemonic as generateNewMnemonic, mnemonicToSeedSync} from '@scure/bip39';
import {wordlist} from '@scure/bip39/wordlists/english';
import {useMemo, useState} from 'react';

import {useNostrContext} from '../../context';
import {useAuth, useCashuStore} from '../../store';

export interface MintData {
  url: string;
  alias: string;
  keys: MintActiveKeys;
  keysets: MintAllKeysets;
  info: GetInfoResponse;
  units: string[];
}

export interface ICashu {
  wallet: CashuWallet;
  mint: CashuMint;
  generateMnemonic: () => string;
  derivedSeedFromMnenomicAndSaved: (mnemonic: string) => Uint8Array;
  // connectCashMint: (mintUrl: string) => Promise<{
  //   mint: CashuMint;
  //   keys: MintKeys[];
  // }>;
  // connectCashWallet: (cashuMint: CashuMint, keys?: MintKeys) => CashuWallet;
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
  checkProofSpent: (proofs: {secret: string}[]) => Promise<ProofState[]>;
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
}

export const useCashu = (): ICashu => {
  const {ndkCashuWallet} = useNostrContext();
  const {privateKey} = useAuth();
  const {setSeed, seed, setMnemonic} = useCashuStore();

  const [activeMint, setActiveMint] = useState<string>();
  const [activeUnit, setActiveUnit] = useState<string>();
  const [mints, setMints] = useState<MintData[]>();
  const [proofs, setProofs] = useState<Proof[]>([]);

  const mint = useMemo(() => {
    if (activeMint) return new CashuMint(activeMint);
  }, [activeMint]);

  const wallet = useMemo(() => {
    if (mint)
      return new CashuWallet(mint, {
        bip39seed: seed,
        unit: activeUnit,
      });
  }, [mint, seed, activeUnit]);

  /** TODO saved in secure store */
  const generateMnemonic = () => {
    const words = generateNewMnemonic(wordlist, 128);
    setMnemonic(words);
    return words;
  };
  /** TODO saved in secure store */
  const derivedSeedFromMnenomicAndSaved = (mnemonic: string) => {
    const seedDerived = mnemonicToSeedSync(mnemonic);
    setSeed(seedDerived);
    return seedDerived;
  };

  // const connectCashMint = async (mintUrl: string) => {
  //   const mintCashu = new CashuMint(mintUrl);
  //   setMint(mintCashu);

  //   const keysRes = await mintCashu?.getKeys();
  //   const keys = keysRes?.keysets;
  //   console.log('keys', keys);
  //   setMintKeys(keys);

  //   const keyssets = await mintCashu?.getKeySets();
  //   setMintAllKeys(keyssets);

  //   return {mint: mintCashu, keys};
  // };

  // const getMintInfo = async (mintUrl: string) => {
  //   const mintCashu = new CashuMint(mintUrl);
  //   const info = await mintCashu.getInfo();
  //   setMintInfo(info);
  //   return info;
  // };

  // const connectCashWallet = (cashuMint: CashuMint, keys?: MintKeys) => {
  //   if (!mint) return undefined;
  //   const wallet = new CashuWallet(cashuMint, {
  //     mnemonicOrSeed: mnemonic ?? seed,
  //     keys: keys ?? mintKeysset,
  //   });
  //   setWallet(wallet);
  //   return wallet;
  // };

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
    await currentMint?.getKeySets().then(({keysets}) => {
      units = keysets
        .map((k) => k.unit)
        .filter((value, index, self) => self.indexOf(value) === index);
    });
    return units;
  };

  const getUnitKeysets = async (unit: string, pMint: MintData): Promise<MintKeyset[]> => {
    const currentMint = new CashuMint(pMint.url);
    let unitKeysets: MintKeyset[];
    await currentMint?.getKeySets().then(({keysets}) => {
      unitKeysets = keysets.filter((k) => k.unit === unit && k.active);
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
      if (!wallet) return;
      const meltQuote = await wallet?.createMeltQuote(invoice);

      const amountToSend = meltQuote.amount + meltQuote.fee_reserve;
      const totalProofsAvailable = pProofs.reduce((acc, p) => acc + p.amount, 0);
      if (totalProofsAvailable < amountToSend) {
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
      const {keep: proofsToKeep, send: proofsToSend} = await wallet.send(
        amountToSend,
        selectedProofs,
      );
      const meltResponse = await wallet.meltProofs(meltQuote, proofsToSend);

      return {meltQuote, meltResponse, proofsToKeep, remainingProofs, selectedProofs};
    } catch (e) {
      console.log('Error meltTokens', e);
      return undefined;
    }
  };

  const payLnInvoice = async (amount: number, request: MintQuoteResponse, proofs: Proof[]) => {
    if (!wallet) return undefined;

    const quote = await wallet.createMeltQuote(request.request);
    const totalAmount = quote.fee_reserve + amount;
    const {keep, send} = await wallet.send(totalAmount, proofs);
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

    const {send} = await wallet.send(amount, tokensProofs, {pubkey: bytesToHex(pubkeyRecipient)});
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
      const proofs = await wallet.receive(encoded, {privkey: bytesToHex(privateKeyHex)});

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
    const {keep, send} = await wallet.send(totalAmount, proofs);
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
      const checkQuoteMelt = await wallet.checkMeltQuote(quote);
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
    generateMnemonic,
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
  };
};
