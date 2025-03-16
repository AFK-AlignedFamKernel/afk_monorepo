import {
    StarknetChainType,
    StarknetInitializer,
    StarknetInitializerType,
    StarknetSigner,
    StarknetTokens
} from "@atomiqlabs/chain-starknet";
// import { SolanaInitializer, SolanaInitializerType } from '@atomiqlabs/chain-solana';
import { BitcoinNetwork, ISwap, LNURLPay, LNURLWithdraw, Swapper, SwapperFactory, SwapperWithSigner, ToBTCLNSwap } from '@atomiqlabs/sdk';
import { useAccount, useConnect, useProvider } from '@starknet-react/core';
import { useEffect, useState } from 'react';
import { Provider, RpcProvider, WalletAccount } from 'starknet';
import { connect } from "starknetkit"

const Factory = new SwapperFactory<[StarknetInitializerType]>([StarknetInitializer] as const);
const Tokens = Factory.Tokens; //Get the supported tokens for all the specified chains.
const starknetRpc = "https://starknet-mainnet.public.blastapi.io/rpc/v0_7"
const rpcProvider = new RpcProvider({
    nodeUrl: starknetRpc
});

export const useAtomiqLab = () => {

    const [walletAtomiq, setWalletAtomiq] = useState<StarknetSigner | null>(null);
    const { connect: connectStarknet } = useConnect();
    const { account } = useAccount()
    const [lastSwap, setLastSwap] = useState<ISwap | null | ToBTCLNSwap<never>>(null);

    const [starknetSwapper, setStarknetSwapper] = useState<SwapperWithSigner<{ STARKNET: StarknetChainType }, "STARKNET">>();

    const handleConnect = async () => {
        //Browser, using get-starknet
        const swo = await connect({
            modalMode: "alwaysAsk"
        });
        let wallet: StarknetSigner | null = null;

        if (swo && swo?.wallet) {
            wallet = new StarknetSigner(new WalletAccount(rpcProvider, swo.wallet));
            setWalletAtomiq(wallet);
            // setWalletAtomiq(swo);
        } else {
            throw new Error("Tried to init swapper, but wallet is null");
        }

        console.log("create new scraper");
        const swapper = Factory.newSwapper({
            chains: {
                STARKNET: {
                    rpcUrl: rpcProvider //You can also pass Provider object here
                }
            },
            bitcoinNetwork: BitcoinNetwork.MAINNET, //or BitcoinNetwork.MAINNET - this also sets the network to use for Solana (solana devnet for bitcoin testnet) & Starknet (sepolia for bitcoin testnet)
            // bitcoinNetwork: BitcoinNetwork.TESTNET, //or BitcoinNetwork.MAINNET - this also sets the network to use for Solana (solana devnet for bitcoin testnet) & Starknet (sepolia for bitcoin testnet)
            // intermediaryUrl: "https://node3.gethopa.com:14003"
            // intermediaryUrl: "https://84-32-32-132.sslip.io:4000"
            // intermediaryUrl: "https://161-97-73-23.sslip.io:4000"
        });

        try {
            console.log("try chain init")

            await swapper.init();

        } catch (error) {
            console.log("error init swapper", error)
        }

        const starknetSwapper = swapper.withChain<"STARKNET">("STARKNET").withSigner(wallet!);
        setStarknetSwapper(starknetSwapper);

        return {
            wallet, starknetSwapper
        };
    }

    const handlePayInvoice = async (lightningInvoice: string) => {
        //Destination lightning network invoice, amount needs to be part of the invoice!
        const _lightningInvoice = lightningInvoice

        console.log("_lightningInvoice", _lightningInvoice)

        let strkSwapper = starknetSwapper;
        if (!strkSwapper) {
            const { starknetSwapper } = await handleConnect()
            strkSwapper = starknetSwapper
        }

        // console.log("init scraper")
        const swap = await strkSwapper?.create(
            Tokens.STARKNET.STRK,
            Tokens.BITCOIN.BTCLN,
            null as any,
            false,
            _lightningInvoice
        );
        //Initiate and pay for the swap
        await swap.commit();

        //Wait for the swap to conclude
        const result: boolean = await swap.waitForPayment();
        if (!result) {
            //Swap failed, money can be refunded
            await swap.refund();
        } else {
            //Swap successful, we can get the lightning payment secret pre-image, which acts as a proof of payment
            const lightningSecret = swap.getSecret();
        }

    }

    const handlePayLnurl = async (lnurlOrIdentifier: string, amount:number) => {

        console.log("starknetSwapper", starknetSwapper)
        let strkSwapper:SwapperWithSigner<{STARKNET: StarknetChainType}, "STARKNET"> | undefined = starknetSwapper
        if (!strkSwapper) {
            const { starknetSwapper } = await handleConnect()
            strkSwapper = starknetSwapper
        }
        console.log("strkSwapper", strkSwapper)

        const swap = await strkSwapper?.create(
            Tokens.STARKNET.STRK,
            Tokens.BITCOIN.BTCLN,
            BigInt(amount),
            false,
            lnurlOrIdentifier
        );

        //Initiate and pay for the swap
        const commit = await swap.commit();
        console.log("commit", commit)
        //Wait for the swap to conclude

        //Wait for the swap to conclude
        const result: boolean = await swap.waitForPayment();
        if (!result) {
            //Swap failed, money can be refunded
            await swap.refund();
        } else {
            //Swap successful, we can get the lightning payment secret pre-image, which acts as a proof of payment
            const lightningSecret = swap.getSecret();
            //In case the LNURL contained a success action, we can read it now and display it to user
            if (swap.hasSuccessAction()) {
                //Contains a success action that should displayed to the user
                const successMessage = swap?.getSuccessAction();
                const description: string = successMessage?.description || ""; //Description of the message
                const text: (string | null) = successMessage?.text || null; //Main text of the message
                const url: (string | null) = successMessage?.url || null; //URL link which should be displayed
            }
        }

    }

    const helperLnurl = async (input: string) => {
        const isLNInvoice: boolean = starknetSwapper.isValidLightningInvoice(input); //Checks if the input is lightning network invoice
        const isLNURL: boolean = starknetSwapper.isValidLNURL(input); //Checks if the input is LNURL or lightning identifier
        if (isLNURL) {
            //Get the type of the LNURL
            const result: (LNURLPay | LNURLWithdraw | null) = await starknetSwapper.getLNURLTypeAndData(input);
            if (result?.type === "pay") {
                const lnurlPayData: LNURLPay = result;
                const minPayable: bigint = lnurlPayData.min; //Minimum payment amount in satoshis
                const maxPayable: bigint = lnurlPayData.max; //Maximum payment amount in satoshis
                const icon: (string | null) = lnurlPayData.icon; //URL encoded icon that should be displayed on the UI
                const shortDescription: (string | null) = lnurlPayData.shortDescription; //Short description of the payment
                const longDescription: (string | null) = lnurlPayData.longDescription; //Long description of the payment
                const maxCommentLength: (number | 0) = lnurlPayData.commentMaxLength; //Maximum allowed length of the payment message/comment (0 means no comment allowed)
                //Should show a UI displaying the icon, short description, long description, allowing the user to choose an amount he wishes to pay and possibly also a comment
            }
            if (result?.type === "withdraw") {
                const lnurlWithdrawData: LNURLWithdraw = result;
                const minWithdrawable: bigint = lnurlWithdrawData.min;
                const maxWithdrawable: bigint = lnurlWithdrawData.max;
                //Should show a UI allowing the user to choose an amount he wishes to withdraw
            }
        }
    }

    const handleBridgeToStarknet = async (amount: string) => {
        const _exactIn = true; //exactIn = true, so we specify the input amount
        const _amount = BigInt(amount); //Amount in BTC base units - sats

        //Create the swap: swapping _amount of satoshis from Bitcoin lightning network to SOL
        const swap = await starknetSwapper.create(
            Tokens.BITCOIN.BTCLN,
            Tokens.STARKNET.STRK,
            _amount,
            _exactIn
        );

        //Get the bitcoin lightning network invoice (the invoice contains pre-entered amount)
        const receivingLightningInvoice: string = swap?.getLightningInvoice();
        //Get the QR code (contains the lightning network invoice)
        const qrCodeData: string = swap?.getQrData(); //Data that can be displayed in the form of QR code

        //Get the amount required to pay, amount to be received and fee
        const amountToBePaidOnBitcoin: string = swap?.getInput().amount; //Human readable amount of BTC that needs to be send to the BTC swap address
        const amountToBeReceivedOnSolana: string = swap?.getOutput().amount; //Human readable amount SOL that will be received on Solana
        const fee: string = swap?.getFee().amountInSrcToken.amount; //Human readable fee in BTC

        try {
            //Wait for the lightning payment to arrive
            await swap.waitForPayment();
            //Claim the swap funds - this will initiate 2 transactions
            // await swap.commitAndClaim();
            //Or for e.g. starknet which doesn't support signing 2 transactions at once
            // await swap.commit(account as never);
            await swap.commit();
            await swap.claim();
        } catch (e) {
            //Error occurred while waiting for payment
        }
    }

    return {
        handlePayInvoice,
        helperLnurl,
        handleBridgeToStarknet,
        handleConnect,
        handlePayLnurl,
        starknetSwapper
    };
}