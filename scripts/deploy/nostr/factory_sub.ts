import { provider } from "../../utils/starknet";

import { Account, constants, Contract } from "starknet";
import { CLASS_HASH_NOSTR_FI_SCORING, NAMESPACE_ADDRESS } from "common";
import dotenv from "dotenv";
import { prepareAndConnectContract } from "../../utils/contract";
import { createFactorySub } from "../../utils/nostr/factory_sub";

dotenv.config();

export const deployFactorySub = async () => {
  console.log("deploy factory sub");
  const privateKey0 = process.env.DEV_PK as string;
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
  const account = new Account(provider, accountAddress0, privateKey0, "1");

  let factorySubAddress = process.env.FACTORY_SUB_ADDRESS as string;
  let factory_sub_address:undefined | string = undefined;
  let factorySub:Contract|undefined;

  let namespaceAddress = NAMESPACE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA] as string;
  const admin_nostr_pubkey = process.env.NOSTR_PUBKEY_ADMIN as string;
  let scoreClassHash =  CLASS_HASH_NOSTR_FI_SCORING[constants.StarknetChainId.SN_SEPOLIA] as string ?? process.env.NOSTR_FI_SCORING_CLASS_HASH as string;
  if (process.env.IS_DEPLOY_CONTRACT == "true") {
    console.log("try deploy key marketplace");
    let factorySub = await createFactorySub(
      accountAddress0,
      admin_nostr_pubkey,
      scoreClassHash,
      namespaceAddress
    );
    console.log("factory sub address", factorySub?.contract_address);

    if (factorySub?.contract_address) {
        factory_sub_address = factorySub?.contract_address;
    }
    // daoFactory = await prepareAndConnectContract(
    //   daoFactory?.contract_address ?? daoFactoryAddress, // uncomment if you recreate a contract
    //   account
    // );
  } else {
    factorySub = await prepareAndConnectContract(
      factory_sub_address ?? factorySubAddress,
      account
    );
  }
  /** TODO script to save constants address */

  return {
    factorySubAddress,
    factorySub,
  };
};

deployFactorySub();
