import {
  Account,
  json,
  Contract,
  cairo,
  uint256,
  byteArray,
  Calldata,
  Uint256,
} from "starknet";
import fs from "fs";
import dotenv from "dotenv";
import { provider } from "../starknet";
import path from "path";
import { finalizeEvent } from "nostr-tools";

dotenv.config();
const PATH_DAO_FACTORY = path.resolve(
  __dirname,
  "../../../onchain/cairo/afk/target/dev/afk_ScoreFactory.contract_class.json"
);
const PATH_DAO_FACTORY_COMPILED = path.resolve(
  __dirname,
  "../../../onchain/cairo/afk/target/dev/afk_ScoreFactory.compiled_contract_class.json"
);

const PATH_TOKEN = path.resolve(
  __dirname,
  "../../../onchain/cairo/afk/target/dev/afk_NostrFiScoring.contract_class.json"
);
const PATH_TOKEN_COMPILED = path.resolve(
  __dirname,
  "../../../onchain/cairo/afk/target/dev/afk_NostrFiScoring.compiled_contract_class.json"
);


/** @TODO spec need to be discuss. This function serve as an example */
export const createFactorySub = async (
  admin: string,
  admin_nostr_pubkey: string,
  score_class_hash: string,
  namespaceAddress: string,

) => {
  try {
    // initialize existing predeployed account 0 of Devnet
    const privateKey0 = process.env.DEV_PK as string;
    const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;

    const account0 = new Account(provider, accountAddress0, privateKey0, "1");
    let DaoFactoryClassHash = process.env.SCORE_FACTORY_CLASS_HASH as string;
    console.log("DaoFactoryClassHash", DaoFactoryClassHash);

    const compiledSierraAAaccount = json.parse(
      fs.readFileSync(PATH_DAO_FACTORY).toString("ascii")
    );
    const compiledAACasm = json.parse(
      fs.readFileSync(PATH_DAO_FACTORY_COMPILED).toString("ascii")
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
    let score_factory_class_hash = process.env.SCORE_FACTORY_CLASS_HASH as string
    if (process.env.REDECLARE_CONTRACT == "true") {

      console.log("try declare dao aa");
      // declare the contract
      const compiledContract = json.parse(
        fs.readFileSync(PATH_TOKEN).toString("ascii")
      );
      const compiledCasm = json.parse(
        fs.readFileSync(PATH_TOKEN_COMPILED).toString("ascii")
      );


      // console.log('check memecoin class hash')

      const declareIfNotToken = await account0.declareIfNot({
        contract: compiledContract,
        casm: compiledCasm,
      });

      if(declareIfNotToken?.transaction_hash) {
        console.log("score_factory_class_hash", score_factory_class_hash);
          
        console.log("declare DAO AA", declareIfNotToken);
        score_factory_class_hash = declareIfNotToken?.class_hash ?? score_factory_class_hash
        console.log("score_factory_class_hash", score_factory_class_hash);
      }
      score_factory_class_hash = declareIfNotToken?.class_hash

      console.log("try declare dao factory");
      // const declareResponse = await account0.declare({
        const declareResponse = await account0.declareIfNot({
        contract: compiledSierraAAaccount,
        casm: compiledAACasm,
      });
      console.log("Declare deploy", declareResponse);

      // TODO wait for transaction

      if(declareResponse?.transaction_hash) {
        console.log("wait declare response")
        // await provider.waitForTransaction(declareResponse?.transaction_hash);
        console.log("DeclareResponse.Factory class_hash", declareResponse.class_hash);
      }

      const contractClassHash = declareResponse.class_hash ?? DaoFactoryClassHash;
      DaoFactoryClassHash = contractClassHash;
      console.log("DaoFactoryClassHash", DaoFactoryClassHash);

      // const nonce = await account0?.getNonce();
      // console.log("nonce", nonce);
    }

    console.log("Try deploy DAO factory");

    const { transaction_hash, contract_address } =
    await account0.deployContract({
      classHash: DaoFactoryClassHash,
      constructorCalldata: [
        admin,
        admin_nostr_pubkey,
        score_class_hash,
        namespaceAddress
      ],
    });
    console.log("transaction_hash", transaction_hash);
    console.log("contract_address", contract_address);
    let tx = await account0?.waitForTransaction(transaction_hash);

    console.log("Tx deploy", tx);
    await provider.waitForTransaction(transaction_hash);
    console.log(
      "✅ New contract Score Factory created.\n   address =",
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
