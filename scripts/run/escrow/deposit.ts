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

dotenv.config();

let sk = process.env.NOSTR_PRIVATE_KEY_ADMIN as string;
// console.log("private key", bytesToHex(sk as any));
const ndk = new NDK({
    // explicitRelayUrls: AFK_RELAYS,
    signer: new NDKPrivateKeySigner(sk),
});

export const deposit = async (props: {
    escrow: Contract;
    account: Account;
    amount: number;
    tokenAddress: string;
    timelock: number;
    alicePublicKey: string;
  }) => {
    try {
      const { escrow, account, amount, tokenAddress, timelock, alicePublicKey } =
        props;
      const depositParams = {
        amount: uint256.bnToUint256(BigInt("0x" + amount)), // amount float. cairo.uint256(amount) for Int
        // Float need to be convert with bnToUint
        token_address: tokenAddress, // token address
        nostr_recipient: cairo.uint256(BigInt("0x" + alicePublicKey)),
        timelock: timelock,
      };
  
  
      console.log("depositParams", depositParams);
  
      let approveCall = {
        contractAddress: tokenAddress,
        // calldata: [escrow?.address, amount],
        calldata: CallData.compile([escrow?.address, depositParams.amount]),
        entrypoint: "approve",
      }
      let depositCall = {
          contractAddress: escrow?.address,
          calldata: CallData.compile(depositParams),
          entrypoint: "deposit",
      }
      const tx = await account.execute([approveCall, depositCall]);
  
      await account.waitForTransaction(tx.transaction_hash);
  
      return tx;
    } catch (e) {
      console.log("Error deposit", e);
    }
  };

  
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