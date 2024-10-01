import {
  Account,
  json,
  Contract,
  cairo,
  uint256,
  byteArray,
  Uint256,
} from "starknet";
import fs from "fs";
import dotenv from "dotenv";
import { provider } from "./starknet";
import path from "path";
import { finalizeEvent } from "nostr-tools";

dotenv.config();
const PATH_LAUNCHPAD = path.resolve(
  __dirname,
  "../../onchain/cairo/target/dev/afk_LaunchpadMarketplace.contract_class.json"
);
const PATH_LAUNCHPAD_COMPILED = path.resolve(
  __dirname,
  "../../onchain/cairo/target/dev/afk_LaunchpadMarketplace.compiled_contract_class.json"
);

/** @TODO spec need to be discuss. This function serve as an example */
export const createLaunchpad = async (
  tokenAddress: string,
  initial_key_price: Uint256,
  step_increase_linear: Uint256,
  coin_class_hash: string,
  threshold_liquidity: Uint256,
  threshold_marketcap: Uint256
) => {
  try {
    // initialize existing predeployed account 0 of Devnet
    const privateKey0 = process.env.DEV_PK as string;
    const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;

    console.log("tokenAddress", tokenAddress);
    console.log("initial_key_price", initial_key_price);
    console.log("step_increase_linear", step_increase_linear);
    console.log("coin_class_hash", coin_class_hash);
    console.log("threshold_liquidity", threshold_liquidity);
    console.log("threshold_marketcap", threshold_marketcap);
    // Devnet or Sepolia account
    const account0 = new Account(provider, accountAddress0, privateKey0, "1");
    let LaunchpadClassHash = process.env.LAUNCHPAD_CLASS_HASH as string;

    const compiledSierraAAaccount = json.parse(
      fs.readFileSync(PATH_LAUNCHPAD).toString("ascii")
    );
    const compiledAACasm = json.parse(
      fs.readFileSync(PATH_LAUNCHPAD_COMPILED).toString("ascii")
    );
    /** Get class hash account */

    // const ch = hash.computeSierraContractClassHash(compiledSierraAAaccount);
    // const compCH = hash.computeCompiledClassHash(compiledAACasm);
    // let pubkeyUint = pubkeyToUint256(nostrPublicKey);

    //Devnet
    // //  fund account address before account creation
    // const { data: answer } = await axios.post(
    //   "http://127.0.0.1:5050/mint",
    //   {
    //     address: AAcontractAddress,
    //     amount: 50_000_000_000_000_000_000,
    //     lite: true,
    //   },
    //   { headers: { "Content-Type": "application/json" } }
    // );
    // console.log("Answer mint =", answer);

    // deploy account

    // const AAaccount = new Account(provider, AAcontractAddress, AAprivateKey);
    /** @description uncomment this to declare your account */
    // console.log("declare account");

    if (process.env.REDECLARE_CONTRACT == "true") {
      console.log("try declare account");
      const declareResponse = await account0.declare({
        contract: compiledSierraAAaccount,
        casm: compiledAACasm,
      });
      console.log("Declare deploy", declareResponse?.transaction_hash);
      await provider.waitForTransaction(declareResponse?.transaction_hash);
      const contractClassHash = declareResponse.class_hash;
      LaunchpadClassHash = contractClassHash;

      const nonce = await account0?.getNonce();
      console.log("nonce", nonce);
    }

    const { transaction_hash, contract_address } =
      await account0.deployContract({
        classHash: LaunchpadClassHash,
        constructorCalldata: [
          accountAddress0,
          initial_key_price,
          tokenAddress,
          step_increase_linear,
          coin_class_hash,
          threshold_liquidity,
          threshold_marketcap,
        ],
      });

    console.log("transaction_hash", transaction_hash);
    console.log("contract_address", contract_address);
    let tx = await account0?.waitForTransaction(transaction_hash);

    console.log("Tx deploy", tx);
    await provider.waitForTransaction(transaction_hash);
    console.log(
      "✅ New contract Launchpad created.\n   address =",
      contract_address
    );

    // const contract = new Contract(compiledSierraAAaccount, contract_address, account0)
    return {
      contract_address,
      tx,
      // contract
    };
  } catch (error) {
    console.log("Error createLaunchpad= ", error);
  }
};
