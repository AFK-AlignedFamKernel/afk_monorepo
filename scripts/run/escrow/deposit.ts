import dotenv from "dotenv";
import { Account, byteArray, CallData, json, uint256, cairo, constants, shortString } from "starknet";
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

let sk = "ebbc14b03f042a4a0c9583b9e6c6c2aa177884bb6a739dbf1d7c2fdeb04c73cf";
// console.log("private key", bytesToHex(sk as any));
const ndk = new NDK({
    // explicitRelayUrls: AFK_RELAYS,
    signer: new NDKPrivateKeySigner(sk),
});

export const depositEscrow = async () => {
    console.log("linked nostr profile");
 
    const privateKey0 = process.env.DEV_PK as string;
    const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;

    const account = new Account(provider, accountAddress0, privateKey0, "1");

    const depositEscrowContract = await prepareAndConnectContract(
        ESCROW_ADDRESSES[constants.StarknetChainId.SN_SEPOLIA],
        account
    );


    let strkAddressUsed = "123";
    //   let strkAddressUsed = account.address;
    //   strkAddressUsed = accountAddress0;

    console.log("account address", account.address);

    let aliceAddress = process.env.NOSTR_PUBKEY_ADMIN as string;
    const tokenAddress = TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK;
   let tx = await deposit({
        escrow: depositEscrowContract,
        account,
        amount: 1,
        tokenAddress: tokenAddress,
        timelock: 1,
        alicePublicKey: aliceAddress
    })

    console.log("tx", tx);

}


depositEscrow()