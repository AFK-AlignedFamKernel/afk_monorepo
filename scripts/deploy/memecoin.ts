import { provider } from "../utils/starknet";
import { Account, cairo, constants } from "starknet";
import { ESCROW_ADDRESS, TOKENS_ADDRESS } from "../constants";
import dotenv from "dotenv";
import { prepareAndConnectContract } from "../utils/contract";
import { createLaunchpad } from "../utils/launchpad";
import { createToken } from "../utils/token";
dotenv.config();

export const deployToken = async () => {
  console.log("deployToken");

  let token;

  let token_address: string | undefined = ESCROW_ADDRESS[
    constants.StarknetChainId.SN_SEPOLIA
  ] as any; // change default address
  const privateKey0 = process.env.DEV_PK as string;
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
  const account = new Account(provider, accountAddress0, privateKey0, "1");
  const total_supply = 100_000_000;
  if (process.env.IS_DEPLOY_CONTRACT == "true") {
    let launchpadContract = await createToken(total_supply, "UHOH", "UHOHLFG");
    console.log("escrow address", launchpadContract?.contract_address);
    if (launchpadContract?.contract_address) {
      token_address = launchpadContract?.contract_address;
      token = await prepareAndConnectContract(
        token_address ?? launchpadContract?.contract_address,
        account
      );
    }
  } else {
  }
  /** TODO script to save constants address */

  return {
    token,
    token_address,
  };
};

deployToken();
