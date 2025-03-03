import { provider } from "../../utils/starknet";
import { Account, cairo, constants } from "starknet";
import dotenv from "dotenv";
import { ART_PEACE_ADDRESS } from "common";
import { CanvasConfig } from "../../constants/canvas.config";
import { prepareAndConnectContract } from "../../utils/contract";
import { createWorld } from "../../utils/multi_canvas/create_world";
dotenv.config();

export const deployWorld = async () => {
  let art_peace_address: string | undefined = ART_PEACE_ADDRESS[
    constants.StarknetChainId.SN_SEPOLIA
  ] as any; // change default address
  const privateKey0 = process.env.DEV_PK as string;
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
  const account = new Account(provider, accountAddress0, privateKey0, "1");
  let startTime = Math.round(new Date().getTime() / 1000)
  let endTime = (Math.round(new Date().getTime()) + (1000 + 60 * 60 * 24 * 90) / 1000)

  let art_peace;
  if (process.env.IS_DEPLOY_CONTRACT == "true") {
    const colors = CanvasConfig.colors?.map((c) => `0x${c}`);
    const votableColors = CanvasConfig.votableColors?.map((c) => `0x${c}`);
    console.log("CanvasConfig", CanvasConfig);
    // const colors = CanvasConfig["colors"]

    let artPeaceContract = await createWorld(
      accountAddress0 ?? account?.address,
      // "afklfg",
      // "afklfg",
      cairo.felt("build6"),
      cairo.felt("build6"),
      CanvasConfig.canvas?.width,
      CanvasConfig.canvas?.height,
      5,
      10,
      colors ?? [],
      votableColors ?? [],
      1,
      startTime,
      endTime,
      1,
      false
    );
    console.log("tx hash create world", artPeaceContract?.transaction_hash);
  } else {
  }

  /** TODO script to save constants address */

  return {
    art_peace,
    art_peace_address,
  };
};

deployWorld();
