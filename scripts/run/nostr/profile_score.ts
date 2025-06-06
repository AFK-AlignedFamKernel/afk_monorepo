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

let sk = process.env.NOSTR_PRIVATE_KEY_ADMIN;
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
    // let sk = "ebbc14b03f042a4a0c9583b9e6c6c2aa177884bb6a739dbf1d7c2fdeb04c73cf";
    let pk = getPublicKey(sk as any);
    console.log("second secret key", sk);

    console.log("second public key", pk);
    // let uint_nostr_user_recipient = BigInt("0x" + pk);
    // let felt_nostr = cairo.felt(uint_nostr_user_recipient);

    console.log(sk);
    console.log(pk);
    // let content = `link ${uint_nostr_user_recipient} to ${starknet_user_recipient}`;
    // let content = `link ${uint_nostr_user_recipient} to ${pk}`;
    //   let content = `link to ${cairo.felt(starknet_address)}`;
    let content = `score nostr profile ${starknet_address}`;
    //   let content = `link ${cairo.felt(starknet_address)}`;
    //   let content = `link ${cairo.felt(starknet_address)}`;

    let event = finalizeEvent(
        {
            kind: 1,
            // created_at: new Date().getTime(),
            created_at: 1716285235,
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

    let isGood = verifyEvent(event);
    console.log("isGood", isGood);

    return {
        event,
        isGood,
        pk,
        sk,
        // signatureR: transferredR,
        // signatureS: transferredS,
    };
};


export const linkedAlgoNostrProfile = async () => {
    console.log("linked nostr profile");
    let namespace_address: string | undefined =
        NAMESPACE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA]; // change default address
    const privateKey0 = process.env.DEV_PK as string;
    const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;

    const account = new Account(provider, accountAddress0, privateKey0, "1");

    const namespaceContract = await prepareAndConnectContract(
        namespace_address,
        account
    );

    const nostrfiContract = await prepareAndConnectContract(
        NOSTR_FI_SCORING_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
        account
    );

    // let strkAddressUsed = "123";
    let strkAddressUsed = account.address;
    //   strkAddressUsed = accountAddress0;

    console.log("account address", account.address);




    // const {
    //     event: eventTool,
    //     isGood, pk, sk } = await linkedToSecond(strkAddressUsed);
    // console.log("private key", sk);
    // console.log("public key", getPublicKey(sk as any));

    // const nostrEvent = await getNostrEvent(account.address);
    // //   console.log("nostrEvent", nostrEvent);
    // let eventUsed = event;
    // console.log("eventUsed", eventUsed);
    // eventUsed.content = `link ${strkAddressUsed}`;
    // const signature = eventUsed.sig ?? '';
    // const signatureR = signature.slice(0, signature.length / 2);
    // const signatureS = signature.slice(signature.length / 2);

    const linkedWallet = {
        starknet_address: strkAddressUsed
    };


    const publicKey = getPublicKey(sk as any);

    console.log("publicKey", publicKey);

    let bigint_nostr_user_recipient = BigInt("0x" + publicKey);
    let felt_nostr = cairo.felt(bigint_nostr_user_recipient);
    console.log("felt_nostr", felt_nostr);
    // Use the exact same timestamp as the test
    let timestamp = 1716285235;

    let event = finalizeEvent(
        {
            kind: 1,
            created_at: timestamp,
            tags: [],
            // content: `link ${cairo.felt(strkAddressUsed)}`,
            content: `score nostr profile ${felt_nostr}`,
        },
        sk as any
    );

    timestamp = event.created_at;
    // Use the known working signature from the test
    // const signature = {
    //     r: "0xac9c698ef50872a5fbfec95f5aaa84014519912ab398f192df6cd3c91dfb563c",
    //     s: "0xf9403e3bf9dea20a06c8416a0ef78ad08e93dd21e665c72826d22976a4d08126"
    // };

    // const eventUsed = await getNostrEvent(strkAddressUsed);
    let eventUsed = event;

    const pubkey = eventUsed.pubkey;
    console.log("pubkey", pubkey);

    let signature = eventUsed.sig;

    let isGood = verifyEvent(eventUsed);
    console.log("isGood", isGood);

    // const signatureR = signature?.r;
    // const signatureS = signature?.s;
    const transferred = await eventUsed.sig;

    const transferredR = `0x${transferred?.slice(0, transferred?.length / 2)}`;
    const transferredS = `0x${transferred?.slice(transferred?.length / 2)}`;
    console.log(transferredR);
    console.log(transferredS);

    let signatureR = transferredR;
    let signatureS = transferredS;
    timestamp = eventUsed.created_at;

    event = eventUsed;
    // let linkedArrayCalldata = CallData.compile([
    //     uint256.bnToUint256(`0x${event.pubkey}`),
    //     timestamp,
    //     1, // kind
    //     byteArray.byteArrayFromString("[]"), // tags
    //     {
    //         starknet_address: strkAddressUsed,
    //         // starknet_address: strkAddressUsed,
    //     },
    //     {
    //         r: uint256.bnToUint256(BigInt(signatureR)),
    //         s: uint256.bnToUint256(BigInt(signatureS)),
    //         // r: uint256.bnToUint256(signatureR),
    //         // s: uint256.bnToUint256(signatureS),
    //     },
    //     {
    //         nostr_address: uint256.bnToUint256(`0x${event.pubkey}`),
    //         starknet_address: strkAddressUsed,
    //         ai_score: cairo.uint256(0),
    //         is_claimed: cairo.felt("false"),
    //         total_score: cairo.uint256(0),
    //         veracity_score: cairo.uint256(0),
    //     }
    // ]);
    // let linkedArrayCalldata = CallData.compile([
    //     uint256.bnToUint256(`0x${event.pubkey}`),
    //     timestamp,
    //     1, // kind
    //     byteArray.byteArrayFromString("[]"), // tags
    //     {
    //         starknet_address: strkAddressUsed,
    //         // starknet_address: strkAddressUsed,
    //     },
    //     {
    //         r: uint256.bnToUint256(BigInt(signatureR)),
    //         s: uint256.bnToUint256(BigInt(signatureS)),
    //         // r: uint256.bnToUint256(signatureR),
    //         // s: uint256.bnToUint256(signatureS),
    //     },
    //     {
    //         nostr_address: uint256.bnToUint256(`0x${event.pubkey}`),
    //         starknet_address: strkAddressUsed,
    //         ai_score: cairo.uint256(0),
    //         is_claimed: cairo.felt(String(false)),
    //         total_score: cairo.uint256(0),
    //         veracity_score: cairo.uint256(0),
    //     }
    // ]);

    let eventData = {
        public_key: uint256.bnToUint256(`0x${eventUsed?.pubkey}`),
        // public_key: uint256.bnToUint256(BigInt(`0x${eventUsed?.pubkey}`)),
        created_at: eventUsed?.created_at,
        kind: eventUsed?.kind ?? 1,
        tags: byteArray.byteArrayFromString(JSON.stringify(eventUsed?.tags ?? [])),
        // tags: shortString.encodeShortString(JSON.stringify(eventUsed?.tags ?? [])),
        content: {
            // starknet_address: strkAddressUsed,
            nostr_address: uint256.bnToUint256(`0x${eventUsed?.pubkey}`),
            //   starknet_address: strkAddressUsed as `0x${string}`,
        },
        sig: {
            r: uint256.bnToUint256(signatureR),
            s: uint256.bnToUint256(signatureS),
            // r: uint256.bnToUint256(BigInt(`${signatureR}`)),
            // s: uint256.bnToUint256(BigInt(`${signatureS}`)),
            // r: uint256.bnToUint256(`0x${signatureR}`),
            // s: uint256.bnToUint256(`0x${signatureS}`),
        },
    }
    let linkedArrayCalldata = CallData.compile([
        uint256.bnToUint256(`0x${event.pubkey}`),
        timestamp,
        1, // kind
        byteArray.byteArrayFromString("[]"), // tags
        {
            starknet_address: strkAddressUsed,
            // starknet_address: strkAddressUsed,
        },
        {
            r: uint256.bnToUint256(BigInt(signatureR)),
            s: uint256.bnToUint256(BigInt(signatureS)),
            // r: uint256.bnToUint256(signatureR),
            // s: uint256.bnToUint256(signatureS),
        },
        uint256.bnToUint256(`0x${event.pubkey}`),
        strkAddressUsed,
        cairo.uint256(0),
        cairo.felt(String(false)),
        cairo.uint256(0),
        cairo.uint256(0),
        // {
        //     nostr_address: uint256.bnToUint256(`0x${event.pubkey}`),
        //     starknet_address: strkAddressUsed,
        //     ai_score: cairo.uint256(0),
        //     is_claimed: cairo.felt(String(false)),
        //     total_score: cairo.uint256(0),
        //     veracity_score: cairo.uint256(0),
        // }
    ]);
    console.log("linked array calldata", linkedArrayCalldata);

    console.log("linked array calldata", linkedArrayCalldata);


    // linkedArrayCalldata = CallData.compile([

    //     {
    //         pubkey: uint256.bnToUint256(`0x${event.pubkey}`),
    //         created_at: event.created_at,
    //         kind: event.kind ?? 1,
    //         tags: byteArray.byteArrayFromString(JSON.stringify(event.tags)),
    //         content: {
    //             // starknet_address: cairo.felt(account?.address!),
    //             starknet_address: accountAddress0,
    //         },
    //         sig: {
    //             // r: uint256.bnToUint256(`${transferredR}`),
    //             // s: uint256.bnToUint256(`${transferredS}`),
    //             r: uint256.bnToUint256(BigInt(signatureR)),
    //             s: uint256.bnToUint256(BigInt(signatureS)),
    //             // r: uint256.bnToUint256(BigInt(`0x${signatureR}`)),
    //             // s: uint256.bnToUint256(BigInt(`0x${signatureS}`)),
    //             // r: uint256.bnToUint256(`0x${signatureR}`),
    //             // s: uint256.bnToUint256(`0x${signatureS}`),
    //             // r: cairo.uint256(BigInt(`0x${signatureR}`)),
    //             // s: cairo.uint256(BigInt(`0x${signatureS}`)),
    //         },
    //     },
    //     {
    //         nostr_address: uint256.bnToUint256(`0x${event.pubkey}`),
    //         starknet_address: strkAddressUsed,
    //         ai_score: cairo.uint256(0),
    //         is_claimed: cairo.felt("false"),
    //         total_score: cairo.uint256(0),
    //         veracity_score: cairo.uint256(0),
    //     }
    // ]);

    let pushAlgoScoreNostrNote = {
        nostr_address: cairo.uint256(100),
        starknet_address: strkAddressUsed,
        // starknet_address: cairo.felt(strkAddressUsed),
        ai_score: cairo.uint256(100),
        is_claimed: cairo.felt(String(false)),
        total_score: cairo.uint256(100),
        veracity_score: cairo.uint256(100),
    }
    // linkedArrayCalldata = CallData.compile({
    //   pubkey: uint256.bnToUint256(`0x${event.pubkey}`),
    //   // cairo.uint256(`0x${event.pubkey}`),
    //   // pubkey: cairo.uint256(BigInt(`0x${event.pubkey}`)),
    //   created_at: event.created_at,
    //   kind: event.kind ?? 1,
    //   tags: byteArray.byteArrayFromString(JSON.stringify(event.tags)),
    //   content: {
    //     // starknet_address: cairo.felt(account?.address!),
    //     starknet_address: accountAddress0,
    //   },
    //   sig: {
    //     // r: uint256.bnToUint256(`${transferredR}`),
    //     // s: uint256.bnToUint256(`${transferredS}`),

    //     // r: uint256.bnToUint256(BigInt(`0x${signatureR}`)),
    //     // s: uint256.bnToUint256(BigInt(`0x${signatureS}`)),
    //     r: uint256.bnToUint256(`0x${signatureR}`),
    //     s: uint256.bnToUint256(`0x${signatureS}`),
    //     // r: cairo.uint256(BigInt(`0x${signatureR}`)),
    //     // s: cairo.uint256(BigInt(`0x${signatureS}`)),
    //   },
    // });


    // const linkedNamespace = {
    //   contractAddress: namespace_address,
    //   entrypoint: 'linked_nostr_profile',
    //   // entrypoint: 'linked_nostr_default_account',
    //   // calldata: CallData.compile(linkedArrayCalldata)
    //   calldata: linkedArrayCalldata,
    //   // calldata: objectCompiled,
    //   // calldata: CallData.compile(linkedArrayCalldata),

    // };
    const linkedNamespace = {
        contractAddress: nostrfiContract?.address,
        // contractAddress: namespace_address,
        entrypoint: 'push_profile_score_algo',
        // calldata: CallData.compile(linkedArrayCalldata)
        calldata: CallData.compile([eventData, pushAlgoScoreNostrNote])
        // calldata: linkedArrayCalldata,
        //  calldata: objectCompiled,
        // calldata: objectCalldata,
        // calldata: CallData.compile(linkedArrayCalldata),

    };
    console.log("linked namespace", linkedNamespace);


    console.log("execute linked namespace");
    // const tx = await nostrfiContract.linked_nostr_profile(objectArrayCalldata);
    // const tx = await namespaceContract.linked_nostr_profile(linkedArrayCalldata);
    //   const tx2 = await namespaceContract.linked_nostr_profile(objectCompiled);

    console.log("execute linked nostr score namespace");
    // const tx2 = await nostrfiContract.linked_nostr_profile(objectCompiled);
    // const tx2 = await nostrfiContract.linked_nostr_profile(objectCompiled);
    // const tx2 = await nostrfiContract.linked_nostr_profile(linkedArrayCalldata);
    const tx2 = await account?.execute([linkedNamespace], undefined, {});
    // console.log("tx", tx);
    console.log("tx2", tx2);

}


linkedAlgoNostrProfile()