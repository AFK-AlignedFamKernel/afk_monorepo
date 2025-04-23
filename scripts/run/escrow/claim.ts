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
    const content = `claim: ${cairo.felt(depositId)},${cairo.felt(accountAddress0)},${cairo.felt(tokenAddress)},${cairo.uint256(0)}`
    const privateKeyNostr = process.env.NOSTR_PRIVATE_KEY_ADMIN as string;
    const timestamp = Date.now();
    const tx = await claimDeposit({
        escrow: depositEscrowContract,
        account,
        depositId,
        content,
        timestamp,
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
    content: string;
    timestamp: number;
    alicePublicKey: string;
    privateKey: any;
    token_address_used: string;
    user_connected: string;
  }) => {
    try {
      const {
        escrow,
        account,
        depositId,
        content,
        timestamp,
        alicePublicKey,
        privateKey,
        token_address_used,
        user_connected,
      } = props;
      const event = finalizeEvent(
        {
          kind: 1,
          tags: [],
          content: content,
          created_at: timestamp,
        },
        privateKey
      );
  
      console.log("event", event);
      const signature = event.sig;
      const signatureR = "0x" + signature.slice(0, signature.length / 2);
      const signatureS = "0x" + signature.slice(signature.length / 2);
      console.log("signature", signature);
      console.log("signatureR", signatureR);
      console.log("signatureS", signatureS);
      let public_key = cairo.uint256(BigInt("0x" + event?.pubkey));
      // let public_key = cairo.uint256(BigInt("0x" + alicePublicKey));
      // expect(depositCurrentId?.recipient).to.eq(BigInt("0x" + alicePublicKey))
      const claimParams = {
        public_key: public_key,
        created_at: timestamp,
        kind: 1,
        tags: byteArray.byteArrayFromString(JSON.stringify(event?.tags)), // tags
        // content: content, // currentId in felt
        // content: cairo.felt(depositId),
        content: {
          deposit_id: cairo.felt(depositId),
          starknet_recipient: user_connected,
          gas_token_address: token_address_used,
          gas_amount: uint256.bnToUint256(0),
        },
        signature: {
          r: cairo.uint256(signatureR),
          s: cairo.uint256(signatureS),
        },
      };
      console.log("claimParams", claimParams);
      const tx = await account.execute({
        contractAddress: escrow?.address,
        calldata: claimParams,
        entrypoint: "claim",
      });
  
      await account.waitForTransaction(tx.transaction_hash);
  
      return tx;
    } catch (e) {
      console.log("Error claim deposit", e);
    }
  };


claim()