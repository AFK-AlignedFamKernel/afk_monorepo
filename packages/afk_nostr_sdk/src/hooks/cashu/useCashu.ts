import { CashuMint, CashuWallet, getEncodedToken, MintQuotePayload, MintQuoteResponse, Proof } from '@cashu/cashu-ts';
import { bytesToHex } from '@noble/curves/abstract/utils';
import { useMemo, useState } from 'react';
import { useAuth } from '../../store';

export const useCashu = () => {
    const [mintUrl, setMintUrl] = useState<string | undefined>("https://mint.minibits.cash/Bitcoin")

    const [mint, setMint] = useState<CashuMint | undefined>(new CashuMint(mintUrl))
    const { privateKey } = useAuth()

    const cashuMint = useMemo(() => {
        return mint;
    }, [mint])
    const [walletCashu, setWallet] = useState<CashuWallet | undefined>(new CashuWallet(mint))
    const [proofs, setProofs] = useState<Proof[]>([])
    const [responseQuote, setResponseQuote] = useState<MintQuoteResponse | undefined>()

    const wallet = useMemo(() => {
        return walletCashu
    }, [walletCashu])
    const connectCashMint = (mintUrl: string) => {
        const mintCashu = new CashuMint(mintUrl)
        setMint(mintCashu)
        return mintCashu;
    }

    const connectCashWallet = (cashuMint: CashuMint) => {
        const wallet = new CashuWallet(cashuMint)
        setWallet(wallet)
        return wallet;
    }

    const mintQuote = async (nb: number) => {

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
        });

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

    return {
        wallet,
        mint,
        connectCashMint,
        connectCashWallet,
        mintQuote,
        mintTokens,
        payLnInvoice,
        sendP2PK,
        receiveP2PK
    }


}