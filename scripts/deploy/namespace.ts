import { provider } from "../utils/starknet";

import { Account, constants } from "starknet";
import { NAMESPACE_ADDRESS } from "../constants";
import dotenv from "dotenv";
import { prepareAndConnectContract } from "../utils/contract";
import { createNamespace } from "../utils/namespace";
dotenv.config();
export const deployNamespace = async () => {
  console.log("deploy namespace");
  let namespace_address: string | undefined =
    NAMESPACE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA]; // change default address
  const privateKey0 = process.env.DEV_PK as string;
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
  const account = new Account(provider, accountAddress0, privateKey0, "1");
  let namespace;
  let namespaceContract;

  if (process.env.IS_DEPLOY_CONTRACT == "true") {
    console.log("try deploy key marketplace");
    let namespaceContract = await createNamespace();
    console.log(
      "namespace contract address",
      namespaceContract?.contract_address
    );

    if (namespaceContract?.contract_address) {
      namespace_address = namespaceContract?.contract_address;
    }
    namespace = await prepareAndConnectContract(
      namespaceContract?.contract_address ?? namespace_address, // uncomment if you recreate a contract
      account
    );
  } else {
    namespaceContract = await prepareAndConnectContract(
      namespace_address ?? namespace_address,
      account
    );
  }
  /** TODO script to save constants address */

  return {
    namespaceContract,
    namespace_address,
  };
};

deployNamespace();
