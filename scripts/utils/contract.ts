import { Account, Contract } from "starknet";
import dotenv from "dotenv";
import { provider } from "./starknet";
dotenv.config();

/** @TODO determine paymaster master specs to send the TX */
export const prepareAndConnectContract = async (
  contractAddress: string,
  account: Account
) => {
  // read abi of Test contract
  const { abi: testAbi } = await provider.getClassAt(contractAddress);

  const contract = new Contract(testAbi, contractAddress, provider);
  // Connect account with the contract
  contract.connect(account);
  return contract;
};
