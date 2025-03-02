import { provider } from "../../utils/starknet";
import { Account, constants } from "starknet";
import dotenv from "dotenv";
import { prepareAndConnectContract } from "../../utils/contract";
import { createCanvasNft } from "../../utils/pixel/canvas_nft";
dotenv.config();

export const deployCanvasNft = async () => {

  let canvasNftAddress=process.env.CANVAS_NFT_ADDRESS as string;
  const privateKey0 = process.env.DEV_PK as string;
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
  const account = new Account(provider, accountAddress0, privateKey0, "1");

  let canvasNft;
  if (process.env.IS_DEPLOY_CONTRACT == "true") {
    // const colors = CanvasConfig["colors"]
    let canvasNftContract = await createCanvasNft();
    console.log("canvasNftContract address", canvasNftContract?.contract_address);
    if (canvasNftContract?.contract_address) {
      canvasNftAddress = canvasNftContract?.contract_address;
      canvasNft = await prepareAndConnectContract(
        canvasNftAddress ?? canvasNftContract?.contract_address,
        account
      );
    }
  } else {
  }

  /** TODO script to save constants address */

  return {
    canvasNft,
    canvasNftAddress,
  };
};

deployCanvasNft();
