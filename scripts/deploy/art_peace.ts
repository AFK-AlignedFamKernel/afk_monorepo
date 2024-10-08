import { provider } from "../utils/starknet";
import { Account, constants } from "starknet";
import dotenv from "dotenv";
import { ART_PEACE_ADDRESS } from "common";
import { createArtPeace } from "../utils/art_peace";
import { CanvasConfig } from "../constants/canvas.config";
import { prepareAndConnectContract } from "../utils/contract";
dotenv.config();

export const deployArtPeace = async () => {
  let art_peace_address: string | undefined = ART_PEACE_ADDRESS[
    constants.StarknetChainId.SN_SEPOLIA
  ] as any; // change default address
  const privateKey0 = process.env.DEV_PK as string;
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
  const account = new Account(provider, accountAddress0, privateKey0, "1");

  let art_peace;
  if (process.env.IS_DEPLOY_CONTRACT == "true") {
    const colors = CanvasConfig.colors?.map((c) => `0x${c}`);
    const votableColors = CanvasConfig.votableColors?.map((c) => `0x${c}`);
    console.log("CanvasConfig", CanvasConfig);
    // const colors = CanvasConfig["colors"]
    let artPeaceContract = await createArtPeace(
      accountAddress0 ?? account?.address,
      CanvasConfig.canvas?.width,
      CanvasConfig.canvas?.height,
      10,
      colors ?? [],
      votableColors ?? [],
      1,
      new Date().getTime(),
      new Date().getTime() + 1000 * 60 * 60 * 24 * 90,
      1,
      false
    );
    console.log("artPeaceContract address", artPeaceContract?.contract_address);
    if (artPeaceContract?.contract_address) {
      art_peace_address = artPeaceContract?.contract_address;
      art_peace = await prepareAndConnectContract(
        art_peace_address ?? artPeaceContract?.contract_address,
        account
      );
    }
  } else {
  }

  /** TODO script to save constants address */

  return {
    art_peace,
    art_peace_address,
  };
};

deployArtPeace();
