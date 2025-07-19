import dotenv from "dotenv";
import { Account, byteArray, CallData, json, uint256, cairo, constants, shortString, Contract, Call, CairoCustomEnum } from "starknet";
import fs from "fs";
import { provider } from "../../utils/starknet";
import { finalizeEvent, generateSecretKey, getPublicKey, serializeEvent, verifyEvent } from "nostr-tools";
import { prepareAndConnectContract } from "../../utils/contract";
import { NAMESPACE_ADDRESS, NOSTR_FI_SCORING_ADDRESS, TOKENS_ADDRESS } from "common/src/contracts";
import { bytesToHex } from "@noble/hashes/utils";
import NDK, { NDKEvent, NDKKind, NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";
import { AFK_RELAYS, formatFloatToUint256 } from "common";
import { NOSTR_FI_SCORING_ABI } from "common"

dotenv.config();

// let sk = "ebbc14b03f042a4a0c9583b9e6c6c2aa177884bb6a739dbf1d7c2fdeb04c73cf";
let sk = "59a772c0e643e4e2be5b8bac31b2ab5c5582b03a84444c81d6e2eec34a5e6c35";
const PK = "5b2b830f2778075ab3befb5a48c9d8138aef017fab2b26b5c31a2742a901afcc"

const voteNostrPubkey = "e2c72a5af0960d8b7b5e913f9b44a5c972a20879dc1b8069766ef265bfacb2ee"
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

export const voteNostrProfileStarknetOnly = async () => {
  const namespace_address = NAMESPACE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
  const privateKey0 = process.env.DEV_PK as string;
  const account = new Account(provider, accountAddress0, privateKey0, "1");

  // Use exactly 123 as the starknet address like in the test
  const starknetAddress = accountAddress0; // This matches sender_address in the test
  // const starknetAddress = "123"; // This matches sender_address in the test
  const starknetAddressFelt = cairo.felt(starknetAddress);


  const amountBase = "1"


  const PROFILE_TO_VOTE = voteNostrPubkey;
  // Format content exactly as in the test
  // const content = `link ${starknetAddress}`;
  const content = `link ${starknetAddressFelt}`;
  const voteParams = {
    // nostr_address: cairo.isTypeFelt(voteNostrPubkey ?? '') ? voteNostrPubkey?.toString(): `0x${voteNostrPubkey}`,
    nostr_address: `0x${PROFILE_TO_VOTE}`,
    vote: 'good',
    // is_upvote: true,
    upvote_amount: amountBase,
    downvote_amount: amountBase,
    amount: amountBase,
    amount_token: amountBase,
  }

  console.log("voteParams", voteParams);

  // Use the exact timestamp from the test
  const timestamp = 1716285235;
  const amountToken = formatFloatToUint256(Number(voteParams.amount_token));
  const amount = formatFloatToUint256(Number(voteParams.amount));
  const upvoteAmount = formatFloatToUint256(Number(voteParams.upvote_amount));
  const downvoteAmount = formatFloatToUint256(Number(voteParams.downvote_amount));
  const voteEnum = voteParams.vote === 'good' ? new CairoCustomEnum({ Good: {} }) : new CairoCustomEnum({ Bad: {} });

  const contract: Contract = new Contract(NOSTR_FI_SCORING_ABI, NOSTR_FI_SCORING_ADDRESS[constants.StarknetChainId.SN_SEPOLIA], provider)
  // const call: Call = contract.populate('linked_nostr_default_account', {
  //     request: requestArgs
  // })

  let quoteAddress = TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK ??
    TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].ETH ?? '';
  const addressContract = NOSTR_FI_SCORING_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];

  // Prepare approve call data
  const approveCallData = {
    contractAddress: quoteAddress,
    entrypoint: 'approve',
    calldata: CallData.compile({
      address: addressContract,
      amount: amountToken,
    }),
  };

  console.log("voteEnum", voteEnum);
  const voteCallData = {
    // nostr_address: `0x${voteParams.nostr_address}`,
    nostr_address: `0x${PROFILE_TO_VOTE}`,
    // is_upvote: voteParams.is_upvote,
    vote: voteEnum,
    //   is_upvote: cairo.felt(String(voteParams.is_upvote ?? true)),
    //   is_upvote: cairo.felt(String(true)),
    // is_upvote: cairo.felt(0),
    // is_upvote:0,
    upvote_amount: upvoteAmount,
    downvote_amount: downvoteAmount,
    amount: amountToken,
    amount_token: amountToken,
  }

  console.log("addressContract", addressContract);

  console.log("voteCallData", voteCallData);
  const vote = {
    contractAddress: addressContract,
    entrypoint: 'vote_nostr_profile_starknet_only',
    calldata: CallData.compile([uint256.bnToUint256(Number(`0x${PROFILE_TO_VOTE}`)), voteEnum, upvoteAmount, downvoteAmount, amountToken, amountToken]),
    // calldata: CallData.compile([...voteCallData]),
    // calldata: CallData.compile(voteCallData),
    // calldata: CallData.compile({
    //   nostr_address: `0x${PROFILE_TO_VOTE}`,
    //   vote: voteEnum,
    //   upvote_amount: upvoteAmount,
    //   downvote_amount: downvoteAmount,
    //   amount: amountToken,
    // }),
  };

  // console.log("voteCall preparation ");
  // const voteCall: Call = contract.populate('vote_nostr_profile_starknet_only', {
  //     request: voteCallData
  // })

  // Execute transaction
  // This is a placeholder - implement actual transaction execution
  const tx = await account.execute([
    approveCallData,
      //  voteCall
    vote


  ]);

  await account.waitForTransaction(tx.transaction_hash);
  console.log("Transaction Hash:", tx.transaction_hash)
  return tx;
};


export const voteNostrProfile = async () => {
  const namespace_address = NAMESPACE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
  const privateKey0 = process.env.DEV_PK as string;
  const account = new Account(provider, accountAddress0, privateKey0, "1");

  // Use exactly 123 as the starknet address like in the test
  const starknetAddress = accountAddress0; // This matches sender_address in the test
  // const starknetAddress = "123"; // This matches sender_address in the test
  const starknetAddressFelt = cairo.felt(starknetAddress);


  const amountBase = "0.001"
  // Format content exactly as in the test
  // const content = `link ${starknetAddress}`;
  const content = `link ${starknetAddressFelt}`;
  const voteParams = {
    nostr_address: cairo.isTypeFelt(voteNostrPubkey ?? '') ? voteNostrPubkey?.toString() : `0x${voteNostrPubkey}`,
    vote: 'good',
    is_upvote: true,
    upvote_amount: amountBase,
    downvote_amount: amountBase,
    amount: amountBase,
    amount_token: amountBase,
  }

  console.log("voteParams", voteParams);

  // Use the exact timestamp from the test
  const timestamp = 1716285235;
  const amountToken = formatFloatToUint256(Number(voteParams.amount_token));
  const amount = formatFloatToUint256(Number(voteParams.amount));
  const upvoteAmount = formatFloatToUint256(Number(voteParams.upvote_amount));
  const downvoteAmount = formatFloatToUint256(Number(voteParams.downvote_amount));
  const voteEnum = voteParams.vote === 'good' ? new CairoCustomEnum({ Good: {} }) : new CairoCustomEnum({ Bad: {} });

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

  const contract: Contract = new Contract(NOSTR_FI_SCORING_ABI, NOSTR_FI_SCORING_ADDRESS[constants.StarknetChainId.SN_SEPOLIA], provider)
  // const call: Call = contract.populate('linked_nostr_default_account', {
  //     request: requestArgs
  // })

  let quoteAddress = TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK ??
    TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].ETH ?? '';
  const addressContract = NOSTR_FI_SCORING_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];

  // Prepare approve call data
  const approveCallData = {
    contractAddress: quoteAddress,
    entrypoint: 'approve',
    calldata: CallData.compile({
      address: addressContract,
      amount: amountToken,
    }),
  };

  console.log("voteEnum", voteEnum);
  const voteCallData = {
    // nostr_address: `0x${voteParams.nostr_address}`,
    nostr_address: `0x${voteParams.nostr_address}`,
    // is_upvote: voteParams.is_upvote,
    vote: voteEnum,
    is_upvote: cairo.felt(String(voteParams.is_upvote ?? true)),
    upvote_amount: upvoteAmount,
    downvote_amount: downvoteAmount,
    amount: amount,
    amount_token: amountToken,
  }


  const vote = {
    contractAddress: addressContract,
    entrypoint: 'vote_nostr_profile_starknet_only',
    calldata: voteCallData,
  };

  const voteCall: Call = contract.populate('vote_nostr_profile_starknet_only', {
    request: voteCallData
  })

  // Execute transaction
  // This is a placeholder - implement actual transaction execution
  const tx = await account.execute([
    approveCallData,
    voteCall


  ]);

  await account.waitForTransaction(tx.transaction_hash);
  console.log("Transaction Hash:", tx.transaction_hash)
  return tx;
};

voteNostrProfileStarknetOnly().catch(err => console.log(err))

// linkedToSecond(process.env.DEV_PUBLIC_KEY as string)