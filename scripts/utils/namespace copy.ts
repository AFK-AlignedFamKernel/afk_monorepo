
import { Account, byteArray, CallData, json, uint256, cairo, constants, shortString } from "starknet";
import fs from "fs";
import dotenv from "dotenv";
import { provider } from "./starknet";
import path from "path";
import { finalizeEvent, generateSecretKey, getPublicKey, serializeEvent, verifyEvent } from "nostr-tools";
import { prepareAndConnectContract } from "./contract";
import { NAMESPACE_ADDRESS, NOSTR_FI_SCORING_ADDRESS } from "common/src/contracts";
import { bytesToHex } from "@noble/hashes/utils";
import NDK, { NDKEvent, NDKKind, NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";
import { AFK_RELAYS } from "common";
dotenv.config();
const PATH_NAMESPACE = path.resolve(
  __dirname,
  "../../onchain/cairo/afk/target/dev/afk_Namespace.contract_class.json"
);
const PATH_NAMESPACE_COMPILED = path.resolve(
  __dirname,
  "../../onchain/cairo/afk/target/dev/afk_Namespace.compiled_contract_class.json"
);

/** @TODO spec need to be discuss. This function serve as an example */
export const createNamespace = async (adminStarknetAddress: string, adminNostrKey: string) => {
  try {
    console.log("Deploy Namespace");
    // initialize existing predeployed account 0 of Devnet
    const privateKey0 = process.env.DEV_PK as string;
    const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;

    // Devnet or Sepolia account
    const account0 = new Account(provider, accountAddress0, privateKey0, "1");
    console.log("account0 address", account0?.address);
    let NamespaceClassHash = process.env.NAMESPACE_CLASS_HASH as string;

    const compiledSierraNamespace = json.parse(
      fs.readFileSync(PATH_NAMESPACE).toString("ascii")
    );
    // console.log("compiledSierraNamespace",compiledSierraNamespace)

    const compiledNamespaceCasm = json.parse(
      fs.readFileSync(PATH_NAMESPACE_COMPILED).toString("ascii")
    );
    /** Get class hash account */

    // const ch = hash.computeSierraContractClassHash(compiledSierraAAaccount);
    // const compCH = hash.computeCompiledClassHash(compiledAACasm);
    // let pubkeyUint = pubkeyToUint256(nostrPublicKey);

    //Devnet
    // //  fund account address before account creation
    // const { data: answer } = await axios.post(
    //   "http://127.0.0.1:5050/mint",
    //   {
    //     address: AAcontractAddress,
    //     amount: 50_000_000_000_000_000_000,
    //     lite: true,
    //   },
    //   { headers: { "Content-Type": "application/json" } }
    // );
    // console.log("Answer mint =", answer);

    // deploy account

    // const AAaccount = new Account(provider, AAcontractAddress, AAprivateKey);
    /** @description uncomment this to declare your account */
    // console.log("declare account");

    if (process.env.REDECLARE_CONTRACT == "true") {
      console.log("try declare namespace contract");

      // const declareFee = await account0.estimateDeclareFee({
      //   contract: compiledSierraNamespace,
      //   casm: compiledNamespaceCasm,
      // });
      // console.log("declareFee", declareFee);

      const declareResponse = await account0.declareIfNot({
        contract: compiledSierraNamespace,
        casm: compiledNamespaceCasm,
      });
      console.log(
        "Declare response",
        declareResponse
      );

      console.log(
        "Declare deploy Namespace",
        declareResponse?.transaction_hash
      );

      if (declareResponse?.transaction_hash) {
        await provider.waitForTransaction(declareResponse?.transaction_hash);
        const contractClassHash = declareResponse.class_hash;
        console.log("Namespace contractClassHash", contractClassHash);
        NamespaceClassHash = contractClassHash;
      }
      // const nonce = await account0?.getNonce();
      // console.log("nonce", nonce);
    }

    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log("deploy namespace");
    console.log("adminStarknetAddress", adminStarknetAddress);
    console.log("adminNostrKey", adminNostrKey);
    const public_key = uint256.bnToUint256(BigInt("0x" + adminNostrKey));
    console.log("public_key", public_key);

    const { transaction_hash, contract_address } =
      await account0.deployContract({
        classHash: NamespaceClassHash,
        constructorCalldata: [
          adminStarknetAddress,
          public_key
        ],
      });

    console.log("transaction_hash", transaction_hash);
    console.log("contract_address", contract_address);
    let tx = await account0?.waitForTransaction(transaction_hash);
    console.log("Tx deploy", tx);
    await provider.waitForTransaction(transaction_hash);
    console.log(
      "✅ New contract Namespace created.\n   address =",
      contract_address
    );

    // const contract = new Contract(compiledSierraAAaccount, contract_address, account0)
    return {
      contract_address,
      tx,
      // contract
    };
  } catch (error) {
    console.log("Error createNamespace = ", error);
  }
};


let sk = "ebbc14b03f042a4a0c9583b9e6c6c2aa177884bb6a739dbf1d7c2fdeb04c73cf";

export const linkedToSecond = async (starknet_address: string) => {
  // let sk = generateSecretKey() // `sk` is a Uint8Array
  // let pk = getPublicKey(sk) // `pk` is a hex string

  // @TODO find a way to convert the contract address to a hex string
  // let starknet_user_recipient = "678";
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
  let sk = "ebbc14b03f042a4a0c9583b9e6c6c2aa177884bb6a739dbf1d7c2fdeb04c73cf";
  let pk = getPublicKey(sk as any);
  console.log("second secret key", sk);

  console.log("second public key", pk);
  // let uint_nostr_user_recipient = BigInt("0x" + pk);
  // let felt_nostr = cairo.felt(uint_nostr_user_recipient);

  console.log(sk);
  console.log(pk);
  // let content = `link ${uint_nostr_user_recipient} to ${starknet_user_recipient}`;
  // let content = `link ${uint_nostr_user_recipient} to ${pk}`;
  let content = `link to ${cairo.felt(starknet_address)}`;
  // let content = `link to ${starknet_address}`;

  let event = finalizeEvent(
    {
      kind: 1,
      // created_at: new Date().getTime(),
      created_at:1716285235,
      tags: [],
      // content: `link to ${cairo.felt(starknet_address)}`,
      // content: `link ${cairo.felt(starknet_address)}`,
      content: `link ${starknet_address}`,

    },
    sk as any,
  );

  console.log(event);
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
  console.log("linked nostr profile");
  let namespace_address: string | undefined =
    NAMESPACE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA]; // change default address
  const privateKey0 = process.env.DEV_PK as string;
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;

  const account = new Account(provider, accountAddress0, privateKey0, "1");

  const namespaceContract = await prepareAndConnectContract(
    NAMESPACE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
    account
  );

  const nostrfiContract = await prepareAndConnectContract(
    NOSTR_FI_SCORING_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
    account
  );

  // const { event, pk, sk } = await linkedToSecond(accountAddress0);

  // const transferred = await event.sig;
  // const signature = event.sig ?? '';

  // // const transferredR = `0x${transferred.slice(0, transferred.length / 2)}`;
  // // const transferredS = `0x${transferred.slice(transferred.length / 2)}`;

  // const signatureR = signature.slice(0, signature.length / 2);
  // const signatureS = signature.slice(signature.length / 2);


  // console.log("signatureR", signatureR);
  // console.log("signatureS", signatureS);

  // let strkAddressUsed = "123";
  let strkAddressUsed = accountAddress0;
  strkAddressUsed = accountAddress0;

  console.log("account address", account.address);

  const ndk = new NDK({
    // explicitRelayUrls: AFK_RELAYS,
    signer: new NDKPrivateKeySigner(sk),
  });
  const getNostrEvent = async () => {
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
  const nostrEvent = await getNostrEvent();
  console.log("nostrEvent", nostrEvent);


  let eventUsed = nostrEvent;
  // eventUsed.content = `link ${strkAddressUsed}`;

  const signature = eventUsed.sig ?? '';
  const signatureR = signature.slice(0, signature.length / 2);
  const signatureS = signature.slice(signature.length / 2);

  let linkedArrayCalldata:any = CallData.compile([
    uint256.bnToUint256(`0x${eventUsed?.pubkey}`),
    // BigInt("0x" + nostrEvent?.pubkey),

    // cairo.uint256(`0x${event.pubkey}`),
    // cairo.uint256(BigInt(`0x${event.pubkey}`)),
    eventUsed?.created_at,
    eventUsed?.kind ?? 1,
    // shortString.encodeShortString(JSON.stringify([])),
    // byteArray.byteArrayFromString(JSON.stringify(eventUsed?.tags)),
    byteArray.byteArrayFromString(JSON.stringify([])),
    {
      // starknet_address: cairo.felt(account?.address!),
      starknet_address: strkAddressUsed,
      // starknet_address: cairo.felt(strkAddressUsed),
    },
    {
      // r: uint256.bnToUint256(`${transferredR}`),
      // s: uint256.bnToUint256(`${transferredS}`),
      r: uint256.bnToUint256(`0x${signatureR}`),
      s: uint256.bnToUint256(`0x${signatureS}`),
      // r: cairo.uint256(BigInt(`0x${signatureR}`)),
      // s: cairo.uint256(BigInt(`0x${signatureS}`)),
    },
    
  ]);


  let objectArrayCalldata = {
      public_key: uint256.bnToUint256(`0x${eventUsed?.pubkey}`),
      // cairo.uint256(`0x${event.pubkey}`),
      // pubkey: cairo.uint256(BigInt(`0x${event.pubkey}`)),
      created_at: eventUsed?.created_at,
      kind: eventUsed?.kind ?? 1,
      tags: shortString.encodeShortString(JSON.stringify([])),
      // tags: byteArray.byteArrayFromString(JSON.stringify(nostrEvent?.tags ?? [])),
      // tags: JSON.stringify(nostrEvent?.tags),
      content: {
        // starknet_address: cairo.felt(strkAddressUsed),
        // nostr_address: uint256.bnToUint256(`0x${eventUsed?.pubkey}`),
        starknet_address: strkAddressUsed,  
        // go: strkAddressUsed,  
      },
      sig: {
  
        // r: uint256.bnToUint256(BigInt(`0x${signatureR}`)),
        // s: uint256.bnToUint256(BigInt(`0x${signatureS}`)),
        r: uint256.bnToUint256(`0x${signatureR}`),
        s: uint256.bnToUint256(`0x${signatureS}`),
    },
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

  console.log("linked array calldata", linkedArrayCalldata);

  const linkedNamespace = {
    contractAddress: namespace_address,
    entrypoint: 'linked_nostr_profile',
    // entrypoint: 'linked_nostr_default_account',
    // calldata: CallData.compile(linkedArrayCalldata)
    calldata: linkedArrayCalldata,
    // calldata: CallData.compile(linkedArrayCalldata),

  };
  console.log("linked namespace", linkedNamespace);


  console.log("execute linked namespace");
  // const tx = await nostrfiContract.linked_nostr_profile(objectArrayCalldata);
  // const tx = await namespaceContract.linked_nostr_profile(linkedArrayCalldata);
  const tx = await namespaceContract.linked_nostr_profile(objectArrayCalldata);

  // const tx = await account?.execute([linkedNamespace], undefined, {});
  console.log("tx", tx);

}

