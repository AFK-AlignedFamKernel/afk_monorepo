import { provider } from "../utils/starknet";

import { Account, constants } from "starknet";
import { KEYS_ADDRESS, TOKENS_ADDRESS } from "../constants";
import dotenv from "dotenv";
import { createKeysMarketplace } from "../utils/keys";
import { prepareAndConnectContract } from "../utils/contract";

dotenv.config();

export const deployKeys = async () => {
  console.log("deploy keys");

  let keys_address: string | undefined =
    KEYS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA]; // change default address

  const privateKey0 = process.env.DEV_PK as string;
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
  const account = new Account(provider, accountAddress0, privateKey0, "1");
  const TOKEN_QUOTE_ADDRESS =
    TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK;
  let key_marketplace;

  if (process.env.IS_DEPLOY_CONTRACT == "true") {
    console.log("try deploy key marketplace");
    let keysContract = await createKeysMarketplace(
      TOKEN_QUOTE_ADDRESS,
      0.01,
      // 1,
      0.01
    );
    console.log("keys contract address", keysContract?.contract_address);

    if (keysContract?.contract_address) {
      keys_address = keysContract?.contract_address;
    }
    key_marketplace = await prepareAndConnectContract(
      keysContract?.contract_address ?? keys_address, // uncomment if you recreate a contract
      account
    );
  } else {
    key_marketplace = await prepareAndConnectContract(
      keys_address ?? keys_address,
      account
    );
  }
  /** TODO script to save constants address */

  return {
    key_marketplace,
    keys_address,
  };
};

deployKeys();
