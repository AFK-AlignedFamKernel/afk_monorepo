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
const SK= "59a772c0e643e4e2be5b8bac31b2ab5c5582b03a84444c81d6e2eec34a5e6c35"
const PK= "5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc"
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
    let content = `link ${starknet_address}`;
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

export const linkedNostrProfile = async () => {
    const namespace_address = NAMESPACE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
    const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
    const privateKey0 = process.env.DEV_PK as string;
    const account = new Account(provider, accountAddress0, privateKey0, "1");

    // Convert starknet address to decimal format WITHOUT 0x prefix
    const starknetAddress = account.address;
    // const starknetAddressFelt = BigInt(account.address).toString(10);
    const starknetAddressFelt = cairo.felt(account.address);

    console.log("starknetAddress", starknetAddress);
    console.log("starknetAddressFelt", starknetAddressFelt);
    // Format content EXACTLY as specified in LinkedStarknetAddressEncodeImpl
    // See the encode implementation in common_interfaces.cairo:
    // @format!("link {}", recipient_address)
    const content = `link ${starknetAddressFelt}`;

    // Use EXACT timestamp from working test
    const timestamp = 1716285235;

    let event = finalizeEvent(
        {
            kind: 1,
            created_at: timestamp,
            tags: [], // Must be empty array
            content: content,
        },
        sk as any
    );

    if (!verifyEvent(event)) {
        throw new Error("Event verification failed locally");
    }

    const signature = event.sig;
    const signatureR = "0x" + signature.slice(0, signature.length / 2);
    const signatureS = "0x" + signature.slice(signature.length / 2);

    // Format calldata EXACTLY as the test case expects

    event = {
        kind: 1,
        created_at: 1716285235,
        tags: [],
        content: 'link 1201582117220250281093610950915479340547227715138863347526632183964894709336',
        pubkey: '5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc',
        id: '31135e106f671fc8bd4fe5060d59c82ad3d27db7a19b24f80eddaa52bdb4f986',
        sig: '999115eeba54e7e5e9652e8576359db375bf089d054bbbd33cd859177ac88713d919f8b27c5436930ced1ca03310d9dfd2b63e3722cb6a14ce8ed72ccbb93038',
    } as any
    const linkedArrayCalldata = CallData.compile([{
        // public_key as uint256
        public_key: cairo.uint256(`0x${event.pubkey}`),
        // created_at as u64
        created_at: timestamp,
        // kind as u16
        kind: 1,
        // tags as ByteArray - must be "[]"
        tags: byteArray.byteArrayFromString("[]"),
        // content as LinkedStarknetAddress struct
        content: {
            // starknet_address: starknetAddressFelt, // decimal format without 0x
            starknet_address: starknetAddress, // decimal format without 0x
        },
        // signature as SchnorrSignature struct
        sig: {
            r: cairo.uint256(signatureR),
            s: cairo.uint256(signatureS),
        },
    }

    ]);

    // const linkedArrayCalldata = CallData.compile([
    //     // public_key as uint256
    //     cairo.uint256(`0x${event.pubkey}`),
    //     // created_at as u64
    //     timestamp,
    //     // kind as u16
    //     1,
    //     // tags as ByteArray - must be "[]"
    //     byteArray.byteArrayFromString("[]"),
    //     // content as LinkedStarknetAddress struct
    //     {
    //         // starknet_address: starknetAddressFelt, // decimal format without 0x
    //         starknet_address: starknetAddress, // decimal format without 0x
    //     },
    //     // signature as SchnorrSignature struct
    //     {
    //         r: cairo.uint256(signatureR),
    //         s: cairo.uint256(signatureS),
    //     },
    // ]);

    // Add debug logs
    console.log("Debug Info:");
    console.log("Content:", content);
    console.log("Public Key:", event.pubkey);
    console.log("Signature R:", signatureR);
    console.log("Signature S:", signatureS);
    console.log("Starknet Address (felt):", starknetAddressFelt);
    console.log("Full event:", event);


    const libCalldata = [
        '184674452764868560519724515817148231628',
        '121185674577639879316174480666903828499',
        '1716285235',
        '1',
        '0',
        '23389',
        '2',
        '1201582117220250281093610950915479340547227715138863347526632183964894709336',
        '322278953791080398970703239293229163626',
        '57449106521304501817227111162887800063',
        '137077259727980457847581598543456117111',
        '31723784927455455798973291421350990118'
        // '184674452764868560519724515817148231628',
        // '121185674577639879316174480666903828499',
        // '1716285235',
        // '1',
        // '0',
        // '23389',
        // '2',
        // '1201582117220250281093610950915479340547227715138863347526632183964894709336',
        // '6744342364905278961218105152019156848',
        // '288993467196674772370774149581502640399',
        // '248051260723712574157634603789891298693',
        // '82210318389643421572033968917451813434'
    ];

    const tx = await account.execute({
        contractAddress: namespace_address,
        entrypoint: 'linked_nostr_profile',
        calldata: linkedArrayCalldata
        // calldata: libCalldata
    });

    await account.waitForTransaction(tx.transaction_hash);
    return tx;
};


linkedNostrProfile()