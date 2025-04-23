import dotenv from "dotenv";
import { Account, byteArray, CallData, json, uint256, cairo, constants, shortString, Contract } from "starknet";
import fs from "fs";
import { provider } from "../../utils/starknet";
import { finalizeEvent, generateSecretKey, getPublicKey, serializeEvent, verifyEvent } from "nostr-tools";
import { prepareAndConnectContract } from "../../utils/contract";
import { NAMESPACE_ADDRESS, NOSTR_FI_SCORING_ADDRESS, ESCROW_ADDRESSES,

    TOKENS_ADDRESS
 } from "common/src/contracts";
import { bytesToHex } from "@noble/hashes/utils";
import NDK, { NDKEvent, NDKKind, NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";
import { AFK_RELAYS } from "common";
import { deposit } from "../../utils/escrow";

dotenv.config();

let sk = process.env.NOSTR_PRIVATE_KEY_ADMIN as string;
// console.log("private key", bytesToHex(sk as any));
const ndk = new NDK({
    // explicitRelayUrls: AFK_RELAYS,
    signer: new NDKPrivateKeySigner(sk),
});

export const claim = async () => {

    const privateKey0 = process.env.DEV_PK as string;
    const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;

    const account = new Account(provider, accountAddress0, privateKey0, "1");

    const depositEscrowContract = await prepareAndConnectContract(
        ESCROW_ADDRESSES[constants.StarknetChainId.SN_SEPOLIA],
        account
    );

    let aliceAddress = process.env.NOSTR_PUBKEY_ADMIN as string;
    const tokenAddress = TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK;
  
    const depositId = 4;
    // const content = `claim: ${depositId}, ${tokenAddress}`
    // const content = `claim: ${cairo.felt(depositId)},${cairo.felt(accountAddress0)},${cairo.felt(tokenAddress)},${cairo.uint256(0)}`
    // const content = `claim: ${depositId},${accountAddress0},${tokenAddress},${uint256.bnToUint256(0)}`;
    const privateKeyNostr = process.env.NOSTR_PRIVATE_KEY_ADMIN as string;
    const tx = await claimDeposit({
        escrow: depositEscrowContract,
        account,
        depositId,
        // content,
        alicePublicKey: aliceAddress,
        privateKey: privateKeyNostr,
        token_address_used: tokenAddress,
        user_connected: accountAddress0,
    })

    console.log("tx", tx);
}

export const claimDeposit = async (props: {
    escrow: Contract;
    account: Account;
    depositId: number;
    alicePublicKey: string;
    privateKey: string;
    token_address_used: string;
    user_connected: string;
}) => {
    try {
        const {
            escrow,
            account,
            depositId,
            privateKey,
            token_address_used,
            user_connected,
        } = props;

        // Convert addresses to felt decimal strings (without 0x prefix)
        // const userAddressFelt = BigInt(user_connected).toString(10);
        // const tokenAddressFelt = BigInt(token_address_used).toString(10);

        const userAddressFelt = cairo.felt(user_connected);
        const tokenAddressFelt = cairo.felt(token_address_used);

        // Format content exactly as in the test
        // const formattedContent = `claim: ${depositId},${userAddressFelt},${tokenAddressFelt},0`;
        // const formattedContent = `claim: ${depositId},${userAddressFelt},${tokenAddressFelt},${cairo.uint256(0)}`;
        const formattedContent = `claim: ${cairo.felt(depositId)},${userAddressFelt},${tokenAddressFelt},0}`;
        console.log("Content to be signed:", formattedContent);

        const timestamp = Math.floor(Date.now() / 1000); // Use seconds
        const event = finalizeEvent(
            {
                kind: 1,
                created_at: timestamp,
                tags: [],
                content: formattedContent,
            },
            privateKey as any
        );

        // Verify the event locally
        if (!verifyEvent(event)) {
            throw new Error("Event failed local verification");
        }

        const signature = event.sig;
        const signatureR = "0x" + signature.slice(0, signature.length/2);
        const signatureS = "0x" + signature.slice(signature.length/2);

        const claimParams = {
            public_key: cairo.uint256(BigInt("0x" + event.pubkey)),
            created_at: event.created_at,
            kind: 1,
            tags: byteArray.byteArrayFromString("[]"),
            content: {
                deposit_id: depositId,
                starknet_recipient: userAddressFelt,  // Use decimal felt string
                gas_token_address: tokenAddressFelt,  // Use decimal felt string
                gas_amount: uint256.bnToUint256(0)
            },
            sig: {
                r: cairo.uint256(BigInt(signatureR)),
                s: cairo.uint256(BigInt(signatureS))
            }
        };

        console.log("Final claim parameters:", JSON.stringify(claimParams, null, 2));

        const tx = await account.execute({
            contractAddress: escrow?.address,
            calldata: CallData.compile(claimParams),
            entrypoint: "claim",
        });

        await account.waitForTransaction(tx.transaction_hash);
        return tx;
    } catch (e) {
        console.error("Error in claimDeposit:", e);
        throw e;
    }
};


claim()