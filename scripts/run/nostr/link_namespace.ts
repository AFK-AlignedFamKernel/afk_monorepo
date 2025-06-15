import dotenv from "dotenv";
import { Account, byteArray, CallData, json, uint256, cairo, constants, shortString } from "starknet";
import fs from "fs";
import { provider } from "../../utils/starknet";
import { finalizeEvent, generateSecretKey, getPublicKey, serializeEvent, verifyEvent } from "nostr-tools";
import { prepareAndConnectContract } from "../../utils/contract";
import { NAMESPACE_ADDRESS, NOSTR_FI_SCORING_ADDRESS } from "common/src/contracts";
import { bytesToHex } from "@noble/hashes/utils";
import NDK, { NDKEvent, NDKKind, NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";
import { AFK_RELAYS } from "common";
dotenv.config();

// let sk = "ebbc14b03f042a4a0c9583b9e6c6c2aa177884bb6a739dbf1d7c2fdeb04c73cf";
let sk = "59a772c0e643e4e2be5b8bac31b2ab5c5582b03a84444c81d6e2eec34a5e6c35";
const SK = "59a772c0e643e4e2be5b8bac31b2ab5c5582b03a84444c81d6e2eec34a5e6c35"
const PK = "5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc"
// console.log("private key", bytesToHex(sk as any));
const ndk = new NDK({
    // explicitRelayUrls: AFK_RELAYS,
    signer: new NDKPrivateKeySigner(sk),
});
const getNostrEvent = async (strkAddressUsed: string) => {
    const eventNDk = new NDKEvent(ndk);
    eventNDk.kind = NDKKind.Text;
    // Format content exactly as Cairo contract: "link {felt252_address}"
    eventNDk.content = `link ${cairo.felt(strkAddressUsed)}`;
    eventNDk.tags = [];

    await eventNDk.sign();
    return eventNDk.rawEvent();
};
export const linkedToSecond = async (starknet_address: string) => {
    // let sk = generateSecretKey() // `sk` is a Uint8Array
    // let pk = getPublicKey(sk) // `pk` is a hex string
    const namespace_address = NAMESPACE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
    const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
    const privateKey0 = process.env.DEV_PK as string;
    const account = new Account(provider, accountAddress0, privateKey0, "1");

    // Convert the starknet address to felt252 format (same as Cairo contract)
    let starknet_user_recipient = cairo.felt(starknet_address);
    console.log("Starknet address as felt:", starknet_user_recipient);

    let pk = getPublicKey(sk as any);
    console.log("second secret key", sk);
    console.log("second public key", pk);

    // Use exactly the same format as Cairo contract: "link {felt252_address}"
    // The Cairo contract does: @format!("link {}", recipient_address)
    // where recipient_address is felt252 = (*self.starknet_address).into()
    let content = `link ${starknet_user_recipient}`;
    let timestamp = 1716285235;
    let event = finalizeEvent(
        {
            kind: 1,
            // created_at: new Date().getTime(),
            created_at: timestamp,
            tags: [],
            content: content,
            //   content: `link ${starknet_address}`,
        },
        sk as any,
    );

    //   console.log(event);
    console.log(serializeEvent(event));

    // const transferred = await event.sig;

    // const transferredR = `0x${transferred.slice(0, transferred.length / 2)}`;
    // const transferredS = `0x${transferred.slice(transferred.length / 2)}`;
    // console.log(transferredR);
    // console.log(transferredS);
    // This should generate the exact same signature as in the test:

    const signature = event.sig;
    const signatureR = "0x" + signature.slice(0, signature.length / 2);
    const signatureS = "0x" + signature.slice(signature.length / 2);

    let isGood = verifyEvent(event);
    console.log("isGood", isGood);
    // Format calldata exactly as the test expects
    const linkedArrayCalldata = CallData.compile([
        // recipient_public_key from test
        cairo.uint256(`0x${event?.pubkey}`),
        timestamp,
        1, // kind
        byteArray.byteArrayFromString("[]"),
        {
            starknet_address: starknet_user_recipient, // Use the felt252 version
        },
        {
            r: cairo.uint256(signatureR),
            s: cairo.uint256(signatureS),
        }
    ]);

    // Debug logs
    console.log("Debug Info:");
    console.log("Content:", content);
    console.log("Starknet Address:", starknet_address);
    console.log("Starknet Address (felt):", starknet_user_recipient);
    console.log("Public Key:", event.pubkey);
    console.log("Signature R:", signatureR);
    console.log("Signature S:", signatureS);

    const tx = await account.execute({
        contractAddress: namespace_address,
        entrypoint: 'linked_nostr_profile',
        calldata: linkedArrayCalldata
    });

    await account.waitForTransaction(tx.transaction_hash);
    return {
        event,
        isGood,
        pk,
        sk,
        // signatureR: transferredR,
        // signatureS: transferredS,
    };
};

export const linkedNostrProfile = async () => {
    const namespace_address = NAMESPACE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
    const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
    const privateKey0 = process.env.DEV_PK as string;
    const account = new Account(provider, accountAddress0, privateKey0, "1");

    // Use exactly 123 as the starknet address like in the test
    const starknetAddress = accountAddress0; // This matches sender_address in the test
    // const starknetAddress = "123"; // This matches sender_address in the test
    const starknetAddressFelt = cairo.felt(starknetAddress);

    // Format content exactly as Cairo contract: "link {felt252_address}"
    // The Cairo contract does: @format!("link {}", recipient_address)
    // where recipient_address is felt252 = (*self.starknet_address).into()
    const content = `link ${starknetAddressFelt}`;

    // Use the exact timestamp from the test
    const timestamp = 1716285235;

    const event = finalizeEvent(
        {
            kind: 1,
            created_at: timestamp,
            tags: [],
            content: content,
        },
        sk as any
    );


    const isGood = verifyEvent(event);
    console.log("isGood", isGood);

    // This should generate the exact same signature as in the test:
    // r: 0xd96a1e022bf0bf6f42333bace383710f0512e9c05e9daf17550c5bcb96eccf70
    // s: 0x3dd921a2ef0cae5fa9906e1575aeb23aba9cef613627578b655f3bf1b0aa6585

    const signature = event.sig;
    // const signatureR = "0xd96a1e022bf0bf6f42333bace383710f0512e9c05e9daf17550c5bcb96eccf70";
    // const signatureS = "0x3dd921a2ef0cae5fa9906e1575aeb23aba9cef613627578b655f3bf1b0aa6585";

    const signatureR = "0x" + signature.slice(0, signature.length / 2);
    const signatureS = "0x" + signature.slice(signature.length / 2);

    // Create the SocialRequest struct that matches the Cairo contract exactly
    // The contract expects: fn linked_nostr_profile(ref self: ContractState, request: SocialRequest<LinkedStarknetAddress>)
    const socialRequest = {
        public_key: cairo.uint256(`0x${event?.pubkey}`),
        created_at: timestamp,
        kind: 1,
        tags: byteArray.byteArrayFromString("[]"),
        content: {
            starknet_address: starknetAddressFelt,
        },
        sig: {
            r: cairo.uint256(signatureR),
            s: cairo.uint256(signatureS),
        }
    };

    // Compile the single SocialRequest parameter
    const linkedArrayCalldata = CallData.compile([socialRequest]);

    // Debug logs
    console.log("Debug Info:");
    console.log("Content:", content);
    console.log("Starknet Address:", starknetAddress);
    console.log("Starknet Address (felt):", starknetAddressFelt);
    console.log("Public Key:", event.pubkey);
    console.log("Signature R:", signatureR);
    console.log("Signature S:", signatureS);

    const tx = await account.execute({
        contractAddress: namespace_address,
        entrypoint: 'linked_nostr_profile',
        calldata: linkedArrayCalldata
    });

    await account.waitForTransaction(tx.transaction_hash);
    return tx;
};


linkedNostrProfile()

// linkedToSecond(process.env.DEV_PUBLIC_KEY as string)