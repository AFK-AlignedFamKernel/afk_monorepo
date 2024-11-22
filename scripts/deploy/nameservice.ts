import { provider } from "../utils/starknet";

import { Account, constants } from "starknet";
import { NAMESPACE_ADDRESS, TOKENS_ADDRESS } from "../constants";
import dotenv from "dotenv";
import { prepareAndConnectContract } from "../utils/contract";
import { createNameservice } from "../utils/nameservice";
import { formatFloatToUint256, } from "common";

dotenv.config();
export const deployNameservice = async () => {
  console.log("deploy nameservice");
  let namespace_address: string | undefined =
    NAMESPACE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA]; // change default address
  const privateKey0 = process.env.DEV_PK as string;
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
  const account = new Account(provider, accountAddress0, privateKey0, "1");
  let namespace;
  let nameserviceContract;
  // const sub_price_nb = 10;
  const sub_price_nb = 1;
  const sub_price = formatFloatToUint256(sub_price_nb);

  const quote_token= TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK

  if (process.env.IS_DEPLOY_CONTRACT == "true") {
    console.log("try deploy nameservice");
    let nameserviceContract = await createNameservice(account?.address, 
      account?.address,
      sub_price,
      quote_token
    );
    console.log(
      "nameservice contract address",
      nameserviceContract?.contract_address
    );

    if (nameserviceContract?.contract_address) {
      namespace_address = nameserviceContract?.contract_address;
    }
    namespace = await prepareAndConnectContract(
      nameserviceContract?.contract_address ?? namespace_address, // uncomment if you recreate a contract
      account
    );
  } else {
    nameserviceContract = await prepareAndConnectContract(
      namespace_address ?? namespace_address,
      account
    );
  }
  /** TODO script to save constants address */

  return {
    nameserviceContract,
    namespace_address,
  };
};

deployNameservice();
