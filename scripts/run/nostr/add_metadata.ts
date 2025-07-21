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


export const addMetadata = async () => {
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
  const nostrMetadata = {
    // nostr_address: cairo.isTypeFelt(voteNostrPubkey ?? '') ? voteNostrPubkey?.toString(): `0x${voteNostrPubkey}`,
    nostr_address: uint256.bnToUint256(Number(`0x${PROFILE_TO_VOTE}`)),
    main_tag: 'good',
    about: 'good',
    event_id_nip_72: 0,
    event_id_nip_29: 0,
  }


  const contract: Contract = new Contract(NOSTR_FI_SCORING_ABI, NOSTR_FI_SCORING_ADDRESS[constants.StarknetChainId.SN_SEPOLIA], provider)
  // const call: Call = contract.populate('linked_nostr_default_account', {
  //     request: requestArgs
  // })

  let quoteAddress = TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK ??
    TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].ETH ?? '';
  const addressContract = NOSTR_FI_SCORING_ADDRESS[constants.StarknetChainId.SN_SEPOLIA];


  console.log("addressContract", addressContract);

  const calldata = CallData.compile([
    uint256.bnToUint256(Number(`0x${PROFILE_TO_VOTE}` || '0')),
    byteArray.byteArrayFromString('cypherpunk'),
    byteArray.byteArrayFromString('cypherpunk'),
    uint256.bnToUint256(0),
    uint256.bnToUint256(0),
    byteArray.byteArrayFromString('cypherpunk'),
  ])
  const addMetadata = {
    contractAddress: addressContract,
    entrypoint: 'add_metadata',
    calldata: calldata,
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


  // const addMetadataCall: Call = contract.populate('add_metadata', {
  //   request: calldata
  // })
  // Execute transaction
  // This is a placeholder - implement actual transaction execution
  const tx = await account.execute([
    //  voteCall
    addMetadata


  ]);

  await account.waitForTransaction(tx.transaction_hash);
  console.log("Transaction Hash:", tx.transaction_hash)
  return tx;
};


addMetadata().catch(err => console.log(err))

// linkedToSecond(process.env.DEV_PUBLIC_KEY as string)