import dotenv from "dotenv";
import { Account, byteArray, CallData, json, uint256, cairo, constants, shortString, Contract, Call } from "starknet";
import fs from "fs";
import { provider } from "../../utils/starknet";
import { finalizeEvent, generateSecretKey, getPublicKey, serializeEvent, verifyEvent } from "nostr-tools";
import { prepareAndConnectContract } from "../../utils/contract";
import { NAMESPACE_ADDRESS, NOSTR_FI_SCORING_ADDRESS } from "common/src/contracts";
import { bytesToHex } from "@noble/hashes/utils";
import NDK, { NDKEvent, NDKKind, NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";
import { AFK_RELAYS } from "common";
import {ABI} from "../../../apps/indexer-v2/indexers/abi/namespace.abi"

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
    // eventNDk.content = `link ${cairo.felt(strkAddressUsed)}`;
    eventNDk.content = `link ${cairo.felt(strkAddressUsed)}`;
    // eventNDk.content = `link ${strkAddressUsed}`;
    // eventNDk.content = `link ${accountAddress0}`;
    // eventNDk.created_at = new Date().getTime();
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
    // @TODO find a way to convert the contract address to a hex string
    let starknet_user_recipient = cairo.felt(starknet_address);
    // let strkAddressUsed  = "123";
    // let starknet_user_recipient = cairo.felt(strkAddressUsed);
    console.log(starknet_user_recipient);

    // let sk = generateSecretKey();
    // let pk = getPublicKey(sk);
    // console.log("pk", pk);
    // console.log("sk", bytesToHex(sk));

    // let sk = "3f310984112c5b5305162ecadfea7d59c682a8c04f16945e65572f22b019c2b0";
    // let pk = "852d7fd9511ccd03c5d8da09273668dbbb160771d5da78ca4367be565fd0fb8b";
    let pk = getPublicKey(sk as any);
    console.log("second secret key", sk);

    console.log("second public key", pk);
    // let uint_nostr_user_recipient = BigInt("0x" + pk);
    // let felt_nostr = cairo.felt(uint_nostr_user_recipient);

    console.log(sk);
    console.log(pk);

    // Use exactly 123 as the starknet address like in the test
    const starknetAddress = accountAddress0; // This matches sender_address in the test
    // let content = `link ${uint_nostr_user_recipient} to ${starknet_user_recipient}`;
    // let content = `link ${uint_nostr_user_recipient} to ${pk}`;
    //   let content = `link to ${cairo.felt(starknet_address)}`;
    let content = `link ${starknet_address}`;
    //   let content = `link ${cairo.felt(starknet_address)}`;
    //   let content = `link ${cairo.felt(starknet_address)}`;
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
        // uint256.bnToUint256(BigInt(`0x${event?.pubkey}`)),
        // cairo.uint256("0x5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc"),
        timestamp,
        1, // kind
        byteArray.byteArrayFromString("[]"),
        {
            starknet_address: starknet_address,
        },
        {
            r: cairo.uint256(signatureR),
            s: cairo.uint256(signatureS),
        }
    ]);

    // Debug logs
    console.log("Debug Info:");
    console.log("Content:", content);
    console.log("Starknet Address:", starknetAddress);
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

    // Format content exactly as in the test
    // const content = `link ${starknetAddress}`;
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

    // Format calldata exactly as the test expects
    const requestArgs = {
        public_key: `0x${event?.pubkey}`,
        created_at: timestamp,
        kind: 1,
        tags: "[]",
        content: {
            starknet_address: starknetAddressFelt,
        },
        sig: {
            r: signatureR,
            s: signatureS,
        }
    }

    // Debug logs
    console.log("Debug Info:");
    console.log("Content:", content);
    console.log("Starknet Address:", starknetAddress);
    console.log("Starknet Address (felt):", starknetAddressFelt);
    console.log("Public Key:", event.pubkey);
    console.log("Signature R:", signatureR);
    console.log("Signature S:", signatureS);

    const contract: Contract = new Contract(ABI, namespace_address, provider)
    const call: Call = contract.populate('linked_nostr_default_account', {
        request: requestArgs
    })

    const tx = await account.execute(call);
    
    await account.waitForTransaction(tx.transaction_hash);
    console.log("Transaction Hash:", tx.transaction_hash)
    return tx;
};


linkedNostrProfile().catch(err => console.log(err))

// linkedToSecond(process.env.DEV_PUBLIC_KEY as string)