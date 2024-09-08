import { CashuMint, CashuWallet, getEncodedToken, MintQuotePayload, MintQuoteResponse, Proof,
    deriveSeedFromMnemonic,
    generateNewMnemonic,


} from '@cashu/cashu-ts';
import { bytesToHex } from '@noble/curves/abstract/utils';
import { useMemo, useState } from 'react';
import { useAuth } from '../../store';

import {NDKCashuWallet} from "@nostr-dev-kit/ndk-wallet"
import { useNostrContext } from '../../context';

export const useCashu = () => {


    const {ndk} = useNostrContext()
    const { privateKey, setSeed, seed, mnemonic, setMnemonic, setMints, setMintsRequests,} = useAuth()


    const [ndkWallet, setNDKWallet] = useState<NDKCashuWallet|undefined>(new NDKCashuWallet(ndk))


    const [mintUrl, setMintUrl] = useState<string | undefined>("https://mint.minibits.cash/Bitcoin")
    const [mint, setMint] = useState<CashuMint | undefined>(new CashuMint(mintUrl))
    // const [mnemonic,setMnemonic] = useState<string|undefined>()
    // const [seed,setSeed] = useState<Uint8Array|undefined>()

    const cashuMint = useMemo(() => {
        return mint;
    }, [mint])
    const [walletCashu, setWallet] = useState<CashuWallet | undefined>(new CashuWallet(mint))
    const [proofs, setProofs] = useState<Proof[]>([])
    const [responseQuote, setResponseQuote] = useState<MintQuoteResponse | undefined>()

    const wallet = useMemo(() => {
        return walletCashu
    }, [walletCashu])



    /** TODO saved in secure store */
    const generateMnemonic = () => {

        const words = generateNewMnemonic()
        setMnemonic(words)


        return words;
    }
    /** TODO saved in secure store */
    const derivedSeedFromMnenomicAndSaved = (mnemonic:string) => {

        const seed = deriveSeedFromMnemonic(mnemonic)
        setSeed(seed)
    }

    const getKeys = () => {
        const keys = mint?.getKeys();

        console.log("keys", keys)
        return keys;
    }

    const getKeySets = () => {
        const keyssets = mint?.getKeySets();

        console.log("keyssets", keyssets)
        return keyssets;
    }


    const connectCashMint = (mintUrl: string) => {
        const mintCashu = new CashuMint(mintUrl)
        setMint(mintCashu)
        return mintCashu;
    }

    const connectCashWallet = (cashuMint: CashuMint) => {
        const wallet = new CashuWallet(cashuMint, {
            mnemonicOrSeed:seed ?? mnemonic
        })
        setWallet(wallet)
        return wallet;
    }

    const requestMintQuote = async (nb: number) => {

        try {

            if (!wallet) return;

            const request = await wallet.createMintQuote(nb);
            // console.log("request", request)
            const mintQuote = await wallet.checkMintQuote(request.quote);
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

        setProofs(proofs?.proofs)
        return proofs;
    }

    const getFeesForExternalInvoice = async(externalInvoice:string) => {
		const fee = (await wallet.createMeltQuote(externalInvoice)).fee_reserve;
  
        return fee
    }


    const meltTokens = async (invoice: string) => {

        const meltQuote = await wallet.createMeltQuote(invoice);
        const amountToSend = meltQuote.amount + meltQuote.fee_reserve;

        // in a real wallet, we would coin select the correct amount of proofs from the wallet's storage
        // instead of that, here we swap `proofs` with the mint to get the correct amount of proofs
        const { returnChange: proofsToKeep, send: proofsToSend } = await wallet.send(amountToSend, proofs);
        // store proofsToKeep in wallet ..

        const meltResponse = await wallet.meltTokens(meltQuote, proofsToSend);

        return meltResponse;
    }

    const payLnInvoice = async (amount: number, request: MintQuoteResponse, proofs: Proof[]) => {


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




    const sendP2PK = async (tokensProofs: Proof[], pubkeyRecipient: Uint8Array, mintUrl: string) => {
        const { send } = await wallet.send(64, tokensProofs, { pubkey: bytesToHex(pubkeyRecipient) });
        const encoded = getEncodedToken({
            token: [{ mint: mintUrl, proofs: send }]
        })

        return {
            send,
            encoded
        }

    }

    const receiveP2PK = async (encoded: string) => {
        const privateKeyHex = new Uint8Array(Buffer.from(privateKey, 'utf-8'));

        const proofs = await wallet.receive(encoded, { privkey: bytesToHex(privateKeyHex) });

        return proofs;
    }
    
    const payExternalInvoice = async (amount: number, fee:number, externalInvoice:string, request: MintQuoteResponse, proofs: Proof[]) => {



        // get the quote from the mint
		const quote_ = await wallet.checkMeltQuote(request.quote);
		expect(quote_).toBeDefined();

		const sendResponse = await wallet.send(2000 + fee, proofs);
		const response = await wallet.payLnInvoice(externalInvoice, sendResponse.send, quote_);

		expect(response).toBeDefined();
		// expect that we have not received the fee back, since it was external
		expect(response.change.reduce((a, b) => a + b.amount, 0)).toBeLessThan(fee);

		// check states of spent and kept proofs after payment
		const sentProofsSpent = await wallet.checkProofsSpent(sendResponse.send);
		expect(sentProofsSpent).toBeDefined();
		// expect that all proofs are spent, i.e. sendProofsSpent == sendResponse.send
		expect(sentProofsSpent).toEqual(sendResponse.send);
		// expect none of the sendResponse.returnChange to be spent
		const returnChangeSpent = await wallet.checkProofsSpent(sendResponse.returnChange);
        return {
            response,
            sentProofsSpent,
            returnChangeSpent
        }
    }

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
        sendP2PK,
        receiveP2PK,
        meltTokens,
        getKeySets,
        getKeys,
        getFeesForExternalInvoice,
        payExternalInvoice

    }

}