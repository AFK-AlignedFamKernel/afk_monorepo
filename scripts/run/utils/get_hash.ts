import { hash } from "starknet";
import dotenv from "dotenv";
dotenv.config();

export const getHash = async (str: string) => {

  const res = hash.getSelectorFromName(str);
  console.log("res str {}", res)
  /** TODO script to save constants address */

  return {
  };
};

getHash("PixelMetadataPlaced");
getHash("ShieldPlaced");
