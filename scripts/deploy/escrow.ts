import { provider } from "../utils/starknet";
import { Account, constants } from "starknet";
import { ESCROW_ADDRESS } from "../constants";
import dotenv from "dotenv";
import { createEscrowAccount } from "../utils/escrow";
import { prepareAndConnectContract } from "../utils/contract";
dotenv.config();

export const deployEscrow = async () => {
  let escrow_address: string | undefined = ESCROW_ADDRESS[
    constants.StarknetChainId.SN_SEPOLIA
  ] as any; // change default address
  console.log("deploy keys");
  const privateKey0 = process.env.DEV_PK as string;
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
  const account = new Account(provider, accountAddress0, privateKey0, "1");

  let escrow;
  if (process.env.IS_DEPLOY_CONTRACT == "true") {
    let escrowContract = await createEscrowAccount();
    console.log("escrow address", escrowContract?.contract_address);
    if (escrowContract?.contract_address) {
      escrow_address = escrowContract?.contract_address;
      escrow = await prepareAndConnectContract(
        escrow_address ?? escrowContract?.contract_address,
        account
      );
    }
  } else {
  }

  /** TODO script to save constants address */

  return {
    escrow,
    escrow_address,
  };
};

deployEscrow();
