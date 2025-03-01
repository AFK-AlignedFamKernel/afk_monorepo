import {
  Account,
  json,

} from "starknet";
import fs from "fs";
import dotenv from "dotenv";
import { provider } from "./starknet";
import path from "path";

dotenv.config();
const PATH_MULTI_CANVAS = path.resolve(
  __dirname,
  "../../onchain/cairo/games/target/dev/afk_games_MultiCanvas.contract_class.json"
);
const PATH_MULTI_CANVAS_COMPILED = path.resolve(
  __dirname,
  "../../onchain/cairo/games/target/dev/afk_games_MultiCanvas.compiled_contract_class.json"
);

/** @TODO spec need to be discuss. This function serve as an example */
export const createMultiCanvas = async (
  owner: string,
) => {
  try {
    // initialize existing predeployed account 0 of Devnet
    const privateKey0 = process.env.DEV_PK as string;
    const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;

    // Devnet or Sepolia account
    const account0 = new Account(provider, accountAddress0, privateKey0, "1");
    let MultiCanvasClassHash = process.env.MULTI_CANVAS_CLASS_HASH as string;
    console.log("MultiCanvasClassHash", MultiCanvasClassHash);

    const compiledSierraAAaccount = json.parse(
      fs.readFileSync(PATH_MULTI_CANVAS).toString("ascii")
    );
    const compiledAACasm = json.parse(
      fs.readFileSync(PATH_MULTI_CANVAS_COMPILED).toString("ascii")
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

    if (process.env.REDECLARE_CONTRACT == "true") {
 
      console.log("try declare multi canvas");
      // const declareResponse = await account0.declare({
        const declareResponse = await account0.declareIfNot({
        contract: compiledSierraAAaccount,
        casm: compiledAACasm,
      });
      console.log("Declare deploy", declareResponse);

      // TODO wait for transaction

      if(declareResponse?.transaction_hash) {
        console.log("wait declare response")
        await provider.waitForTransaction(declareResponse?.transaction_hash);
        console.log("DeclareResponse.class_hash", declareResponse.class_hash);
      }

      const contractClassHash = declareResponse.class_hash ?? MultiCanvasClassHash;
      MultiCanvasClassHash = contractClassHash;
      console.log("MultiCanvasClassHash", MultiCanvasClassHash);

      // const nonce = await account0?.getNonce();
      // console.log("nonce", nonce);
    }


    const { transaction_hash, contract_address } =
    await account0.deployContract({
      classHash: MultiCanvasClassHash,
      constructorCalldata: [
        accountAddress0,
      ],
    });

   

    console.log("transaction_hash", transaction_hash);
    console.log("contract_address", contract_address);
    let tx = await account0?.waitForTransaction(transaction_hash);

    console.log("Tx deploy", tx);
    await provider.waitForTransaction(transaction_hash);
    console.log(
      "✅ New contract Mutli Canvas created.\n   address =",
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
