import { provider } from "../utils/starknet";

import { Account, constants, Contract } from "starknet";
import { KEYS_ADDRESS, TOKENS_ADDRESS } from "../constants";
import dotenv from "dotenv";
import { prepareAndConnectContract } from "../utils/contract";
import { createDaoFactory } from "../utils/dao/dao_factory";

dotenv.config();

export const deployDaoFactory = async () => {
  console.log("deploy dao factory");
  const privateKey0 = process.env.DEV_PK as string;
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
  const account = new Account(provider, accountAddress0, privateKey0, "1");

  let daoFactoryAddress = process.env.DAO_FACTORY_ADDRESS as string;
  let dao_factory_address:undefined | string = undefined;
  let daoFactory:Contract|undefined;
  if (process.env.IS_DEPLOY_CONTRACT == "true") {
    console.log("try deploy key marketplace");
    let daoFactory = await createDaoFactory();
    console.log("dao factory address", daoFactory?.contract_address);

    if (daoFactory?.contract_address) {
      dao_factory_address = daoFactory?.contract_address;
    }
    // daoFactory = await prepareAndConnectContract(
    //   daoFactory?.contract_address ?? daoFactoryAddress, // uncomment if you recreate a contract
    //   account
    // );
  } else {
    daoFactory = await prepareAndConnectContract(
      dao_factory_address ?? daoFactoryAddress,
      account
    );
  }
  /** TODO script to save constants address */

  return {
    daoFactoryAddress,
    daoFactory,
  };
};

deployDaoFactory();
