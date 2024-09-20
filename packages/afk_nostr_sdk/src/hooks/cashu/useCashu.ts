import {
    CashuMint, CashuWallet, getEncodedToken, MintQuotePayload, MintQuoteResponse, Proof,
    deriveSeedFromMnemonic,
    generateNewMnemonic,
    Keys,
    MintKeys,
    MintKeyset,
    GetInfoResponse,
    MeltTokensResponse,
    MeltQuoteResponse,
    getDecodedToken,
} from '@cashu/cashu-ts';
import { useMemo, useState } from 'react';

import { NDKCashuToken, NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet"
import { bytesToHex } from '@noble/curves/abstract/utils';
import { useNostrContext } from '../../context';
import { useAuth, useCashuStore } from '../../store';

export const useCashu = () => {


    const { ndk, ndkCashuWallet, ndkWallet } = useNostrContext()
    const { privateKey } = useAuth()
    const { setSeed, seed, mnemonic, setMnemonic, setMints, setMintsRequests, } = useCashuStore()

    const [mintUrl, setMintUrl] = useState<string | undefined>("https://mint.minibits.cash/Bitcoin")
    const [mint, setMint] = useState<CashuMint>(new CashuMint(mintUrl ?? "https://mint.minibits.cash/Bitcoin"))
    const [keys, setKeys] = useState<Keys[]>()
    const [mintKeys, setMintKeys] = useState<MintKeys[]>()
    const [mintKeysset, setMintKeyset] = useState<MintKeys | undefined>()
    const [mintInfo, setMintInfo] = useState<GetInfoResponse | undefined>()

    const cashuMint = useMemo(() => {
        return mint;
    }, [mint])
    const [walletCashu, setWallet] = useState<CashuWallet | undefined>(new CashuWallet(mint, {
        mnemonicOrSeed: mnemonic ?? seed,
        keys: mintKeysset,
        unit: mintKeysset?.unit
    }))
    const [proofs, setProofs] = useState<Proof[]>([])
    const [responseQuote, setResponseQuote] = useState<MintQuoteResponse | undefined>()

    const wallet = useMemo(() => {
        return walletCashu
        // return new CashuWallet(mintUrl ? new CashuMint(mintUrl) : mint, {
        //     mnemonicOrSeed: mnemonic ?? seed,
        //     keys: mintKeysset,
        //     // unit:"sat"
        // })
    }, [walletCashu, mint, seed, mnemonic, mintUrl])

    /** TODO saved in secure store */
    const generateMnemonic = () => {

        const words = generateNewMnemonic()
        setMnemonic(words)
        return words;
    }
    /** TODO saved in secure store */
    const derivedSeedFromMnenomicAndSaved = (mnemonic: string) => {

        const seed = deriveSeedFromMnemonic(mnemonic)
        setSeed(seed)
        return seed;
    }


    const connectCashMint = async (mintUrl: string) => {
        const mintCashu = new CashuMint(mintUrl)
        setMint(mintCashu)

        const keys = await (await mint.getKeys()).keysets
        console.log("keys", keys)
        setMintKeys(keys)
        return { mint: mintCashu, keys };
    }

    const getMintInfo = async (mintUrl: string) => {
        const mintCashu = new CashuMint(mintUrl)
        const info = await mintCashu.getInfo();
        setMintInfo(info)
        return info;
    }

    const connectCashWallet = (cashuMint: CashuMint, keys?: MintKeys) => {
        if (!cashuMint && !mint) return undefined;
        const wallet = new CashuWallet(cashuMint, {
            mnemonicOrSeed: mnemonic ?? seed,
            keys: keys ?? mintKeysset
        })
        setWallet(wallet)
        return wallet;
    }

    const getKeys = async () => {
        const keys = await mint?.getKeys();

        console.log("keys", keys)
        console.log("wallet.keys", wallet?.keys)
        return keys;
    }

    const getProofsSpents = async (proofs: Proof[]) => {

        const proofsCheck = await wallet?.checkProofsSpent([...proofs]);

        console.log("proofsCheck", proofsCheck)
        return proofsCheck;
    }
    const getProofs = async (tokens: NDKCashuToken[]) => {

        const proofsCheck = await ndkCashuWallet?.checkProofs([...tokens]);

        console.log("proofsCheck", proofsCheck)
        return proofsCheck;
    }
    const getKeySets = async () => {
        const keyssets = await mint?.getKeys();

        console.log("keyssets", keyssets)
        return keyssets;
    }


    const requestMintQuote = async (nb: number) => {
        try {

            if (!wallet) return;

            const request = await wallet?.createMintQuote(nb);
            // console.log("request", request)
            const mintQuote = await wallet?.checkMintQuote(request.quote);
            // console.log("mintQuote", mintQuote)

            setResponseQuote(mintQuote);

            return {
                request,
                // mintQuote
            };
        } catch (e) {
            console.log("MintQuote error", e)
        }




    }

    const mintTokens = async (amount: number, quote: MintQuoteResponse) => {

        const proofs = await wallet?.mintTokens(amount, quote.quote)
        console.log("proofs mint tokens", proofs)
        if (!proofs) return proofs;
        setProofs(proofs?.proofs)
        return proofs;
    }

    const getFeesForExternalInvoice = async (externalInvoice: string) => {
        if (!wallet) return undefined;
        const fee = (await wallet.createMeltQuote(externalInvoice)).fee_reserve;

        return fee
    }


    const meltTokens = async (invoice: string, proofsProps?: Proof[]) => {
        try {
            if (!wallet) return undefined;
            const meltQuote = await wallet.createMeltQuote(invoice);
            console.log("meltQuote", meltQuote)
            const amountToSend = meltQuote.amount + meltQuote.fee_reserve;
            console.log("amountToSend", amountToSend)


            // const checkProofs = await wallet.checkProofsSpent(proofs)
            // console.log("checkProofs", checkProofs)
            // in a real wallet, we would coin select the correct amount of proofs from the wallet's storage
            // instead of that, here we swap `proofs` with the mint to get the correct amount of proofs
            const { returnChange: proofsToKeep, send: proofsToSend } = await wallet.send(amountToSend, proofsProps ?? proofs);
            // store proofsToKeep in wallet ..
            console.log("proofsToSend", proofsToSend)

            const meltResponse = await wallet.meltTokens(meltQuote, proofsToSend);

            return meltResponse;
        } catch (e) {
            console.log("Error meltTokens", e)
        }

    }


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
            returnChangeSpent
        }
    }

    const payLnInvoiceWithToken = async (amount: number, token: string, request: MintQuoteResponse, meltQuote: MeltQuoteResponse, proofs: Proof[]) => {

        if (!wallet) return undefined;
        const response = await wallet.payLnInvoiceWithToken(request.request,
            token,
            meltQuote,
        );

        return {
            response,
        }
    }



    const sendP2PK = async (amount: number, tokensProofs: Proof[], pubkeyRecipient: Uint8Array, mintUrl: string) => {
        if (!wallet) return undefined;

        const { send } = await wallet.send(amount, tokensProofs, { pubkey: bytesToHex(pubkeyRecipient) });
        const encoded = getEncodedToken({
            token: [{ mint: mintUrl, proofs: send }]
        })

        return {
            send,
            encoded
        }

    }

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


    }

    const payExternalInvoice = async (amount: number, fee: number, externalInvoice: string, request: MintQuoteResponse, proofs: Proof[]) => {

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
            returnChangeSpent
        }
    }

    const checkMeltQuote = async (quote: string) => {
        try {
            if (!wallet) return undefined;

            const checkMeltQuote = await wallet.checkMeltQuote(quote)

            console.log("checkMeltQuote", checkMeltQuote)

            return checkMeltQuote;
        } catch (e) {
            console.log("Error checkMeltQuote", e)

        }

    }

    const checkProofSpent = async (proofs: {
        secret: string;
    }[]) => {
        try {
            if (!wallet) return undefined;

            const checkProofSpent = await wallet.checkProofsSpent(proofs)

            console.log("checkProofSpent", checkProofSpent)

            return checkProofSpent;
        } catch (e) {
            console.log("Error checkProofSpent", e)
        }

    }



    const checkMintQuote = async (quote: string) => {
        try {
            if (!wallet) return undefined;

            const resCheckMintQuote = await wallet.checkMintQuote(quote)
            console.log("resCheckMintQuote", resCheckMintQuote)

            return resCheckMintQuote;
        } catch (e) {
            console.log("Error checkMintQuote", e)

        }

    }

    const receiveEcash = async (ecash: string) => {

        if (!ecash) {
            return;
        }
        const encoded = getDecodedToken(ecash)
        console.log("encoded", encoded)


        const response = await wallet?.receive(encoded);
        console.log("response", response)

        if (response) {
        }
    }


    const handleReceivedPayment = async (amount:number, quote:MintQuoteResponse) => {
        const receive = await mintTokens(Number(amount), quote)
        console.log("receive", receive)

        const encoded = getEncodedToken({
            token: [{ mint: mint?.mintUrl, proofs: receive?.proofs as Proof[] }]
        });
        // const response = await wallet?.receive(encoded);
        const response = await receiveP2PK(encoded);


        console.log("response", response)
     
        return response;

    }
    return {
        wallet,
        mint,
        mintUrl,
        setMintUrl,
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
        handleReceivedPayment

    }

}