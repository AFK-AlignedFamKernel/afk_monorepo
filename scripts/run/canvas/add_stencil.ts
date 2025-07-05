import { provider } from "../../utils/starknet";
import { Account, constants, CallData, cairo, byteArray } from "starknet";
import dotenv from "dotenv";
import { USERNAME_STORE_ADDRESS, ART_PEACE_ADDRESS, MULTI_CANVAS_ADDRESS} from "common";
import { prepareAndConnectContract } from "../../utils/contract";
import { createQuest } from "../../utils/quest";
dotenv.config();



const CHAIN_FACTIONS=[
  "Starknet",
  "Solana",
  "Bitcoin",
  "Base",
  "ZkSync",
  "Polygon",
  "Optimism",
  "Scroll",
  "Arbitrum",
  "Dogecoin",
  "Ethereum",
  "Hyperliquid",
  // "Linea"  
]
export const deployAllChainFactionAdmin = async () => {
  let username_store_address: string | undefined = USERNAME_STORE_ADDRESS[
    constants.StarknetChainId.SN_SEPOLIA
  ] as any; // change default address
  const privateKey0 = process.env.DEV_PK as string;
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
  const account = new Account(provider, accountAddress0, privateKey0, "1");

  /** TODO script to save constants address */

  const multiCanvasContractAddress = MULTI_CANVAS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA] as string; 
 const multiCanvas = await prepareAndConnectContract(
  multiCanvasContractAddress,
    account
  );


  // Loop into Chain faction files

  const calls=[]
  const addStencilCall = {
    contractAddress: multiCanvasContractAddress,
    entrypoint: 'add_stencil',
    calldata: CallData.compile([
      0,
      {
          hash: cairo.felt("0"),
          width: 128,
          height: 128,
          position: 59502,
          ipfs_hash: byteArray.byteArrayFromString("QmR3JAXJd5pYQhSre4ASLQU4FzSkyyk9WzA5a4XtHdXmys"),
      }
    ]),
  };

  calls.push(addStencilCall)

  const tx = await account.execute(calls)

  console.log("tx", tx)
  
  return {
  };
};

deployAllChainFactionAdmin();
