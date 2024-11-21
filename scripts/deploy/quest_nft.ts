import { provider } from "../utils/starknet";
import { Account, constants } from "starknet";
import dotenv from "dotenv";
import { USERNAME_STORE_ADDRESS } from "common";
import { prepareAndConnectContract } from "../utils/contract";
import { createUsernameStore } from "../utils/username_store";
dotenv.config();

export const deployQuestNft = async () => {
  let username_store_address: string | undefined = USERNAME_STORE_ADDRESS[
    constants.StarknetChainId.SN_SEPOLIA
  ] as any; // change default address
  const privateKey0 = process.env.DEV_PK as string;
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
  const account = new Account(provider, accountAddress0, privateKey0, "1");

  let username_store;
  if (process.env.IS_DEPLOY_CONTRACT == "true") {
    // const colors = CanvasConfig["colors"]
    let usernameStoreContract = await createUsernameStore();
    console.log("usernameStoreContract address", usernameStoreContract?.contract_address);
    if (usernameStoreContract?.contract_address) {
      username_store_address = usernameStoreContract?.contract_address;
      username_store = await prepareAndConnectContract(
        username_store_address ?? usernameStoreContract?.contract_address,
        account
      );
    }
  } else {
  }

  /** TODO script to save constants address */

  return {
    username_store,
    username_store_address,
  };
};

deployQuestNft();
