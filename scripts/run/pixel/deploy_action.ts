import { provider } from "../../utils/starknet";
import { Account, constants } from "starknet";
import dotenv from "dotenv";
import { USERNAME_STORE_ADDRESS } from "common";
import { prepareAndConnectContract } from "../../utils/contract";
import { createQuest } from "../../utils/quest";
dotenv.config();

export const deployQuestNft = async () => {
  let username_store_address: string | undefined = USERNAME_STORE_ADDRESS[
    constants.StarknetChainId.SN_SEPOLIA
  ] as any; // change default address
  const privateKey0 = process.env.DEV_PK as string;
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
  const account = new Account(provider, accountAddress0, privateKey0, "1");

  /** TODO script to save constants address */

  return {
  };
};

deployQuestNft();
