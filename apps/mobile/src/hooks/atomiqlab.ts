import { useEffect, useState } from 'react';

import { LaunchDataMerged } from '../types/keys';
import { useGetDeployToken } from './api/indexer/useDeployToken';
import { useGetTokenLaunch } from './api/indexer/useLaunchTokens';
import { StarknetInitializer, StarknetInitializerType, StarknetSigner, StarknetTokens, } from '@atomiqlabs/chain-starknet';
import { BitcoinNetwork, ISwap, LNURLPay, LNURLWithdraw, Swapper, SwapperFactory, ToBTCLNSwap, } from '@atomiqlabs/sdk';
import { WalletAccount } from 'starknet';
import { useAccount, useConnect, useProvider } from '@starknet-react/core';

export const useAtomiqLab = () => {

    const [walletAtomiq, setWalletAtomiq] = useState<StarknetSigner | null>(null);
    const { connect } = useConnect();
    const { account } = useAccount()
    const [starknetSwapper, setStarknetSwapper] = useState<any>();
    const { provider } = useProvider()
    const [lastSwap, setLastSwap] = useState<ISwap | null | ToBTCLNSwap<never>>(null);
    const Factory = new SwapperFactory<[StarknetInitializerType]>([StarknetInitializer] as const);
    const Tokens = Factory.Tokens; //Get the supported tokens for all the specified chains.
    const solanaRpc = "https://api.mainnet-beta.solana.com";
    const starknetRpc = "https://starknet-mainnet.public.blastapi.io/rpc/v0_7";
    const swapper = Factory.newSwapper({
        chains: {
            SOLANA: {
                rpcUrl: solanaRpc //You can also pass Connection object here
            },
            STARKNET: {
                rpcUrl: starknetRpc //You can also pass Provider object here
            }
        },
        bitcoinNetwork: BitcoinNetwork.TESTNET //or BitcoinNetwork.MAINNET - this also sets the network to use for Solana (solana devnet for bitcoin testnet) & Starknet (sepolia for bitcoin testnet)
    });

    const handleConnect = async () => {
        //Browser, using get-starknet
        const swo = await connect();

        // const provider = account
        let wallet: StarknetSigner | null = null;
        if (account) {
            wallet = new StarknetSigner(new WalletAccount(provider, account as any));
            setWalletAtomiq(wallet);
        }

        await swapper.init();

        const starknetSwapper = swapper.withChain<"STARKNET">("STARKNET").withSigner(walletAtomiq!.account.address as never);

        setStarknetSwapper(starknetSwapper);

        return wallet;
        // const wallet = new StarknetSigner(new WalletAccount(starknetRpc, swo));
        // const wallet = new StarknetSigner(new WalletAccount(provider, account));
    }

    const handlStarknetSwapper = async () => {
        const starknetSwapper = swapper.withChain<"STARKNET">("STARKNET").withSigner(walletAtomiq!.account.address as never);

        setStarknetSwapper(starknetSwapper);

    }

    const handlePayInvoice = async (lightningInvoice: string) => {
        //Destination lightning network invoice, amount needs to be part of the invoice!
        const _lightningInvoice = lightningInvoice

        //Create the swap: swapping Starknet to Bitcoin lightning
        // const swap = await swapper.create(
        //     Tokens.SOLANA.SOL,
        //     Tokens.BITCOIN.BTCLN,
        //     null,
        //     false,
        //     _lightningInvoice
        // );
        // const swap = await swapper.create(
        //     walletAtomiq!.signer.address,
        //     Tokens.STARKNET.STRK,
        //     Tokens.BITCOIN.BTCLN,
        //     null,
        //     false,
        //     _lightningInvoice
        // );
        const swap = await swapper.create(
            walletAtomiq?.account.address as never,
            StarknetTokens.ERC20_STRK?.toString() as never,
            Tokens.BITCOIN.BTCLN,
            null as any,
            false,
            _lightningInvoice
        );
        // setLastSwap(swap);
        //Get the amount required to pay and fee
        const amountToBePaid: string = swap.getInput().amount; //Human readable amount to be paid on the Solana side (including fee)
        const fee: string = swap.getFee().amountInSrcToken.amount; //Human readable swap fee paid on the Solana side (already included in the the above amount)

        //Get swap expiration time
        const expiry: number = swap.getExpiry(); //Expiration time of the swap in UNIX milliseconds, swap needs to be initiated before this time

        //Initiate and pay for the swap
        await swap.commit(account as never);

        //Wait for the swap to conclude
        const result: boolean = await swap.waitForPayment();
        if (!result) {
            //Swap failed, money can be refunded
            await swap.refund(account as never);
        } else {
            //Swap successful, we can get the lightning payment secret pre-image, which acts as a proof of payment
            const lightningSecret = swap.getSecret();
        }

    }

    const helperLnurl = async (input: string) => {
        const isLNInvoice: boolean = swapper.isValidLightningInvoice(input); //Checks if the input is lightning network invoice
        const isLNURL: boolean = swapper.isValidLNURL(input); //Checks if the input is LNURL or lightning identifier
        if (isLNURL) {
            //Get the type of the LNURL
            const result: (LNURLPay | LNURLWithdraw | null) = await swapper.getLNURLTypeAndData(input);
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
        const swap= await swapper.create(
            walletAtomiq!.account.address as never,
            StarknetTokens.ERC20_STRK?.toString() as never,
            Tokens.BITCOIN.BTCLN,
            _amount,
            _exactIn
        ) as any;
        
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
        } catch(e) {
            //Error occurred while waiting for payment
        }
    }

    return {
        handlePayInvoice,
        helperLnurl,
        handleBridgeToStarknet,
        handleConnect,
        
    };
};
