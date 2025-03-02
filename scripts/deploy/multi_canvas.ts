import { provider } from "../utils/starknet";
import { Account, cairo, constants, uint256 } from "starknet";
import dotenv from "dotenv";
import { prepareAndConnectContract } from "../utils/contract";
import {
  CLASS_HASH,
} from "common";
import { createMultiCanvas } from "../utils/multi_canvas";

dotenv.config();

export const deployMultiCanvas = async () => {
  console.log("deployMultiCanvas");

  let multi_canvas;

  let multi_canvas_address: string | undefined;
  const privateKey0 = process.env.DEV_PK as string;
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
  const account = new Account(provider, accountAddress0, privateKey0, "1");

  
    CLASS_HASH.TOKEN[constants.StarknetChainId.SN_SEPOLIA];
  if (process.env.IS_DEPLOY_CONTRACT == "true") {
    let multiCanvasContract = await createMultiCanvas(
      accountAddress0,
    );
    console.log(
      "multiCanvasContract address",
      multiCanvasContract?.contract_address
    );
    if (multiCanvasContract?.contract_address) {
      multi_canvas_address = multiCanvasContract?.contract_address;
      multi_canvas = await prepareAndConnectContract(
        multi_canvas_address ?? multiCanvasContract?.contract_address,
        account
      );

      // Setup params
      // launchpad.set_address_jediswap_factory_v2(JEDISWAP_FACTORY_ADDRESS);

      // NFT position address to add liquidity
      // launchpad.set_address_jediswap_nft_router_v2(JEDISWAP_ADDRESS_NFT);
    }
  } else {
  }
  /** TODO script to save constants address */

  return {
    multi_canvas,
    multi_canvas_address,
  };
};

deployMultiCanvas();
