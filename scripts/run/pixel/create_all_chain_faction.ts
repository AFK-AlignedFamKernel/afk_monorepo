import { provider } from "../../utils/starknet";
import { Account, constants, CallData, cairo } from "starknet";
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
export const deployAllChainFactionAdmin = async () => {
  let username_store_address: string | undefined = USERNAME_STORE_ADDRESS[
    constants.StarknetChainId.SN_SEPOLIA
  ] as any; // change default address
  const privateKey0 = process.env.DEV_PK as string;
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
  const account = new Account(provider, accountAddress0, privateKey0, "1");

  /** TODO script to save constants address */

  const artPeaceContractAddress = ART_PEACE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA] as string; 
 const art_peace = await prepareAndConnectContract(
  artPeaceContractAddress,
    account
  );


  // Loop into Chain faction files

  const calls=[]

  for(let chain of CHAIN_FACTIONS) {
    const feltName = cairo.felt( String(chain))

    const initChainCall = {
      contractAddress: artPeaceContractAddress,
      entrypoint: 'init_chain_faction',
      calldata: CallData.compile({
        name: feltName,
      }),
    };

    calls.push(initChainCall)
  }


  const tx = await account.execute(calls)

  console.log("tx", tx)
  
  return {
  };
};

deployAllChainFactionAdmin();
