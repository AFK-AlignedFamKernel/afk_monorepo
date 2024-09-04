import { CashuMint, CashuWallet, getEncodedToken, MintQuotePayload, MintQuoteResponse, Proof } from '@cashu/cashu-ts';
import { bytesToHex } from '@noble/curves/abstract/utils';
import { useState } from 'react';
import { useNostrContext } from '../../context';
import { useAuth } from '../../store';

export const useCashu = () => {

    const [mint, setMint] = useState<CashuMint | undefined>()

    const {privateKey} = useAuth()
    const [wallet, setWallet] = useState<CashuWallet | undefined>()
    const [proofs, setProofs] = useState<Proof[]>([])
    const [responseQuote, setResponseQuote] = useState<MintQuoteResponse | undefined>()
    const connectCashMint = (mintUrl: string) => {
        const mint = new CashuMint(mintUrl)
        setMint(mint)
        return mint;

    }

    const connectCashWallet = (cashuMint: CashuMint) => {
        const wallet = new CashuWallet(cashuMint)
        setWallet(wallet)
        return wallet;
    }

    const mintQuote = async (nb: number) => {

        const request = await wallet.createMintQuote(nb);
        expect(request).toBeDefined();
        const mintQuote = await wallet.checkMintQuote(request.quote);
        setResponseQuote(mintQuote);

        return { request, mintQuote };

    }

    const mintTokens = async (nb: number, quote: MintQuoteResponse) => {

        const proofs = await wallet?.mintTokens(nb, quote.quote)

        setProofs(proofs?.proofs)
        return proofs;
    }


    const payLnInvoice = async (request: MintQuoteResponse) => {

        const tokens = await wallet.mintTokens(100, request.quote);

        const quote = await wallet.checkMeltQuote(request.quote);
        const sendResponse = await wallet.send(10, tokens.proofs);
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

    }

    const receiveP2PK = async (encoded:string) => {
        const privateKeyHex = new Uint8Array(Buffer.from(privateKey, 'utf-8'));

        const proofs = await wallet.receive(encoded, { privkey: bytesToHex(privateKeyHex) });

        return proofs;
    }

    return {
        connectCashMint,
        connectCashWallet,
        mintQuote,
        mintTokens,
        payLnInvoice,
        sendP2PK,
        receiveP2PK
    }


}