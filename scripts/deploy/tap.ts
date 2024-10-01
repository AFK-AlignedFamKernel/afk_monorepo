import { provider } from "../utils/starknet";
import { Account } from "starknet";
import dotenv from "dotenv";
import { prepareAndConnectContract } from "../utils/contract";
import { createTapQuests } from "../utils/tap";

dotenv.config();

export const deployTapQuest = async () => {
  console.log("deployTapQuest");

  let tapContract: any | undefined;
  let tap;
  let tap_address: string | undefined;
  const privateKey0 = process.env.DEV_PK as string;
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
  const account = new Account(provider, accountAddress0, privateKey0, "1");
  const chainId = await provider.getChainId();
  if (process.env.IS_DEPLOY_CONTRACT == "true") {
    let tapContract = await createTapQuests();
    console.log("tap address", tapContract?.contract_address);
    if (tapContract?.contract_address) {
      tap_address = tapContract?.contract_address;
      tap = await prepareAndConnectContract(
        tap_address ?? tapContract?.contract_address,
        account
      );
    }
  } else {
  }

  /** TODO script to save constants address */

  return {
    tapContract,
    tap_address,
    tap,
  };
};

deployTapQuest();
