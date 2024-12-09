import { provider } from "../../utils/starknet";
import { Account, constants } from "starknet";
import dotenv from "dotenv";
import { USERNAME_STORE_ADDRESS, ART_PEACE_ADDRESS} from "common";
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
export const deployChainFactionAdmin = async () => {
  let username_store_address: string | undefined = USERNAME_STORE_ADDRESS[
    constants.StarknetChainId.SN_SEPOLIA
  ] as any; // change default address
  const privateKey0 = process.env.DEV_PK as string;
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
  const account = new Account(provider, accountAddress0, privateKey0, "1");

  /** TODO script to save constants address */

  const artPeaceContract = ART_PEACE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA] as string; 
  const art_peace_address = artPeaceContract;
 const art_peace = await prepareAndConnectContract(
    art_peace_address,
    account
  );


  // Loop into Chain faction files



  return {
  };
};

deployChainFactionAdmin();
