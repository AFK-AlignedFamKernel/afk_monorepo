import {
  CashuMint,
  CashuWallet,
  getEncodedToken,
  MintQuoteResponse,
  Proof,
  deriveSeedFromMnemonic,
  generateNewMnemonic,
  MintKeys,
  GetInfoResponse,
  MeltQuoteResponse,
  getDecodedToken,
  MintAllKeysets,
  MeltTokensResponse,
  MintActiveKeys,
} from '@cashu/cashu-ts';
import {useMemo, useState} from 'react';
import {NDKCashuToken} from '@nostr-dev-kit/ndk-wallet';

import {bytesToHex} from '@noble/curves/abstract/utils';
import {useNostrContext} from '../../context';
import {useAuth, useCashuStore} from '../../store';

export interface MintData {
  url: string;
  alias: string;
}

export interface ICashu {
  wallet: CashuWallet;
  mint: CashuMint;
  generateMnemonic: () => string;
  derivedSeedFromMnenomicAndSaved: (mnemonic: string) => Uint8Array;
  connectCashMint: (mintUrl: string) => Promise<{
    mint: CashuMint;
    keys: MintKeys[];
  }>;
  connectCashWallet: (cashuMint: CashuMint, keys?: MintKeys) => CashuWallet;
  requestMintQuote: (nb: number) => Promise<{
    request: MintQuoteResponse;
  }>;
  mintTokens: (
    amount: number,
    quote: MintQuoteResponse,
  ) => Promise<{
    proofs: Array<Proof>;
  }>;
  payLnInvoice: (
    amount: number,
    request: MintQuoteResponse,
    proofs: Proof[],
  ) => Promise<{
    response: MeltTokensResponse;
    sentProofsSpent: Proof[];
    returnChangeSpent: Proof[];
  }>;
  payLnInvoiceWithToken: (
    token: string,
    request: MintQuoteResponse,
    meltQuote: MeltQuoteResponse,
  ) => Promise<{
    response: MeltTokensResponse;
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
  meltTokens: (invoice: string, proofsProps?: Proof[]) => Promise<MeltTokensResponse>;
  getKeySets: () => Promise<MintActiveKeys>;
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
    response: MeltTokensResponse;
    sentProofsSpent: Proof[];
    returnChangeSpent: Proof[];
  }>;
  getProofsSpents: (proofs: Proof[]) => Promise<Proof[]>;
  getMintInfo: (mintUrl: string) => Promise<GetInfoResponse>;
  checkMeltQuote: (quote: string) => Promise<MeltQuoteResponse>;
  checkMintQuote: (quote: string) => Promise<MintQuoteResponse>;
  checkProofSpent: (proofs: {secret: string}[]) => Promise<
    {
      secret: string;
    }[]
  >;
  receiveEcash: (ecash: string) => Promise<Proof[]>;
  handleReceivedPayment: (amount: number, quote: MintQuoteResponse) => Promise<Proof[]>;
  mintUrls: MintData[];
  setMintUrls: React.Dispatch<React.SetStateAction<MintData[]>>;
  activeMintIndex: number;
  setActiveMintIndex: React.Dispatch<React.SetStateAction<number>>;
  mintInfo: GetInfoResponse;
  setMintInfo: React.Dispatch<React.SetStateAction<GetInfoResponse>>;
  mintProps: CashuMint;
}

export const useCashu = (): ICashu => {
  const {ndkCashuWallet} = useNostrContext();
  const {privateKey} = useAuth();
  const {setSeed, seed, mnemonic, setMnemonic} = useCashuStore();

  const [activeMintIndex, setActiveMintIndex] = useState<number>(0);
  const [mintUrls, setMintUrls] = useState<MintData[]>([
    {
      url: 'https://mint.minibits.cash/Bitcoin',
      alias: 'Default Mint',
    },
  ]);
  const [mintProps, setMint] = useState<CashuMint>(
    new CashuMint(mintUrls?.[activeMintIndex]?.url ?? 'https://mint.minibits.cash/Bitcoin'),
  );

  const mint = useMemo(() => {
    return (
      new CashuMint(mintUrls?.[activeMintIndex]?.url ?? 'https://mint.minibits.cash/Bitcoin') ??
      mintProps
    );
  }, [activeMintIndex]);
  const [_, setMintKeys] = useState<MintKeys[]>();
  const [mintAllKeysets, setMintAllKeys] = useState<MintAllKeysets>();
  const [mintKeysset] = useState<MintKeys | undefined>();
  const [mintInfo, setMintInfo] = useState<GetInfoResponse | undefined>();

  const [walletCashu, setWallet] = useState<CashuWallet | undefined>(
    new CashuWallet(mint, {
      mnemonicOrSeed: mnemonic ?? seed,
      keys: mintKeysset,
      unit: mintKeysset?.unit,
    }),
  );
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [mintQuoteResponse, setResponseQuote] = useState<MintQuoteResponse | undefined>();

  const wallet = useMemo(() => {
    return new CashuWallet(mint, {
      mnemonicOrSeed: mnemonic ?? seed,
      keys: mintKeysset,
      unit: mintKeysset?.unit,
    });
    // return new CashuWallet(mintUrl ? new CashuMint(mintUrl) : mint, {
    //     mnemonicOrSeed: mnemonic ?? seed,
    //     keys: mintKeysset,
    //     // unit:"sat"
    // })
  }, [walletCashu, mint, seed, mnemonic]);

  /** TODO saved in secure store */
  const generateMnemonic = () => {
    const words = generateNewMnemonic();
    setMnemonic(words);
    return words;
  };
  /** TODO saved in secure store */
  const derivedSeedFromMnenomicAndSaved = (mnemonic: string) => {
    const seedDerived = deriveSeedFromMnemonic(mnemonic);
    setSeed(seedDerived);
    return seedDerived;
  };

  const connectCashMint = async (mintUrl: string) => {
    const mintCashu = new CashuMint(mintUrl);
    setMint(mintCashu);

    const keys = (await mintCashu?.getKeys()).keysets;
    console.log('keys', keys);
    setMintKeys(keys);

    const keyssets = await mintCashu?.getKeySets();
    setMintAllKeys(keyssets);

    return {mint: mintCashu, keys};
  };

  const getMintInfo = async (mintUrl: string) => {
    const mintCashu = new CashuMint(mintUrl);
    const info = await mintCashu.getInfo();
    setMintInfo(info);
    return info;
  };

  const connectCashWallet = (cashuMint: CashuMint, keys?: MintKeys) => {
    if (!mint) return undefined;
    const wallet = new CashuWallet(cashuMint, {
      mnemonicOrSeed: mnemonic ?? seed,
      keys: keys ?? mintKeysset,
    });
    setWallet(wallet);
    return wallet;
  };

  const getKeys = async () => {
    const keys = await mint?.getKeys();
    return keys;
  };

  const getProofsSpents = async (proofs: Proof[]) => {
    const proofsCheck = await wallet?.checkProofsSpent([...proofs]);
    return proofsCheck;
  };
  const getProofs = async (tokens: NDKCashuToken[]) => {
    const proofsCheck = await ndkCashuWallet?.checkProofs([...tokens]);
    return proofsCheck;
  };
  const getKeySets = async () => {
    const keyssets = await mint?.getKeys();
    return keyssets;
  };

  const requestMintQuote = async (nb: number) => {
    try {
      if (!wallet) return;

      const request = await wallet?.createMintQuote(nb);
      const mintQuote = await wallet?.checkMintQuote(request.quote);
      setResponseQuote(mintQuote);
      return {
        request,
      };
    } catch (e) {
      console.log('MintQuote error', e);
    }
  };

  const mintTokens = async (amount: number, quote: MintQuoteResponse) => {
    const proofs = await wallet?.mintTokens(amount, quote.quote);
    if (!proofs) return proofs;
    setProofs(proofs?.proofs);
    return proofs;
  };

  const getFeesForExternalInvoice = async (externalInvoice: string) => {
    if (!wallet) return undefined;
    const fee = (await wallet.createMeltQuote(externalInvoice)).fee_reserve;

    return fee;
  };

  const meltTokens = async (invoice: string, proofsProps?: Proof[]) => {
    try {
      if (!wallet) return undefined;
      const meltQuote = await wallet.createMeltQuote(invoice);
      const amountToSend = meltQuote.amount + meltQuote.fee_reserve;

      // const checkProofs = await wallet.checkProofsSpent(proofs)
      // console.log("checkProofs", checkProofs)
      // in a real wallet, we would coin select the correct amount of proofs from the wallet's storage
      // instead of that, here we swap `proofs` with the mint to get the correct amount of proofs
      const {
        // returnChange: proofsToKeep,
        send: proofsToSend,
      } = await wallet.send(amountToSend, proofsProps ?? proofs);
      // store proofsToKeep in wallet ..
      console.log('proofsToSend', proofsToSend);
      const meltResponse = await wallet.meltTokens(meltQuote, proofsToSend);

      return meltResponse;
    } catch (e) {
      console.log('Error meltTokens', e);
    }
  };

  const payLnInvoice = async (amount: number, request: MintQuoteResponse, proofs: Proof[]) => {
    if (!wallet) return undefined;

    const quote = await wallet.checkMeltQuote(request.quote);
    const sendResponse = await wallet.send(amount, proofs);
    const response = await wallet.payLnInvoice(request.request, sendResponse.send, quote);

    // check states of spent and kept proofs after payment
    const sentProofsSpent = await wallet.checkProofsSpent(sendResponse.send);
    // expect that all proofs are spent, i.e. sendProofsSpent == sendResponse.send
    // expect none of the sendResponse.returnChange to be spent
    const returnChangeSpent = await wallet.checkProofsSpent(sendResponse.returnChange);

    return {
      response,
      sentProofsSpent,
      returnChangeSpent,
    };
  };

  const payLnInvoiceWithToken = async (
    token: string,
    request: MintQuoteResponse,
    meltQuote: MeltQuoteResponse,
  ) => {
    if (!wallet) return undefined;
    const response = await wallet.payLnInvoiceWithToken(request.request, token, meltQuote);

    return {
      response,
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
      token: [{mint: mintUrl, proofs: send}],
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

    // get the quote from the mint
    const quote_ = await wallet.checkMeltQuote(request.quote);

    const sendResponse = await wallet.send(amount + fee, proofs);
    const response = await wallet.payLnInvoice(externalInvoice, sendResponse.send, quote_);

    // expect that we have not received the fee back, since it was external

    // check states of spent and kept proofs after payment
    const sentProofsSpent = await wallet.checkProofsSpent(sendResponse.send);
    // expect that all proofs are spent, i.e. sendProofsSpent == sendResponse.send
    // expect none of the sendResponse.returnChange to be spent
    const returnChangeSpent = await wallet.checkProofsSpent(sendResponse.returnChange);
    return {
      response,
      sentProofsSpent,
      returnChangeSpent,
    };
  };

  const checkMeltQuote = async (quote: string) => {
    try {
      if (!wallet) return undefined;

      const checkQuoteMelt = await wallet.checkMeltQuote(quote);

      console.log('checkQuoteMelt', checkQuoteMelt);

      return checkQuoteMelt;
    } catch (e) {
      console.log('Error checkMeltQuote', e);
    }
  };

  const checkProofSpent = async (
    proofs: {
      secret: string;
    }[],
  ) => {
    try {
      if (!wallet) return undefined;
      const proofsSpents = await wallet.checkProofsSpent(proofs);
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

    if (response) {
    }
    return response;
  };

  const handleReceivedPayment = async (amount: number, quote: MintQuoteResponse) => {
    const receive = await mintTokens(Number(amount), quote);
    console.log('receive', receive);

    const encoded = getEncodedToken({
      token: [{mint: mint?.mintUrl, proofs: receive?.proofs as Proof[]}],
    });
    // const response = await wallet?.receive(encoded);
    const response = await receiveP2PK(encoded);

    console.log('response', response);

    return response;
  };

  return {
    wallet,
    mint,
    generateMnemonic,
    derivedSeedFromMnenomicAndSaved,
    connectCashMint,
    connectCashWallet,
    requestMintQuote,
    mintTokens,
    payLnInvoice,
    payLnInvoiceWithToken,
    sendP2PK,
    receiveP2PK,
    meltTokens,
    getKeySets,
    getKeys,
    getProofs,
    getFeesForExternalInvoice,
    payExternalInvoice,
    getProofsSpents,
    getMintInfo,
    checkMeltQuote,
    checkMintQuote,
    checkProofSpent,
    receiveEcash,
    handleReceivedPayment,
    mintUrls,
    setMintUrls,
    activeMintIndex,
    setActiveMintIndex,
    mintInfo,
    setMintInfo,
    mintProps,
  };
};
