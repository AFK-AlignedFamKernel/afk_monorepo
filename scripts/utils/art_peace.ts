import {
  Account,
  json,
  Contract,
  cairo,
  uint256,
  byteArray,
  CallData,
} from "starknet";
import fs from "fs";
import dotenv from "dotenv";
import { provider } from "./starknet";
import path from "path";
import { finalizeEvent } from "nostr-tools";
import { CanvasConfig } from "common";

dotenv.config();
const PATH_ART_PEACE = path.resolve(
  __dirname,
  "../../onchain/cairo/target/dev/afk_ArtPeace.contract_class.json"
);
const PATH_ART_PEACE_COMPILED = path.resolve(
  __dirname,
  "../../onchain/cairo/target/dev/afk_ArtPeace.compiled_contract_class.json"
);

/** @TODO spec need to be discuss. This function serve as an example */
export const createArtPeace = async (
  host: string,
  canvas_width: number,
  canvas_height: number,
  time_between_pixels: number,

  color_palette: any[],
  votable_colors: any[],
  daily_new_colors_count: number,
  start_time: number,
  end_time: number,
  daily_quests_count: number,
  devmode: boolean
) => {
  try {
    // initialize existing predeployed account 0 of Devnet
    const privateKey0 = process.env.DEV_PK as string;
    const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;

    // Devnet or Sepolia account
    const account0 = new Account(provider, accountAddress0, privateKey0, "1");
    let ArtPeaceClassHash = process.env.ART_PEACE_CLASS_HASH as string;

    const compiledSierraAAaccount = json.parse(
      fs.readFileSync(PATH_ART_PEACE).toString("ascii")
    );
    const compiledAACasm = json.parse(
      fs.readFileSync(PATH_ART_PEACE_COMPILED).toString("ascii")
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
      ArtPeaceClassHash = contractClassHash;

      const nonce = await account0?.getNonce();
      console.log("nonce", nonce);
    }

    console.log("host", host);
    console.log("canvas_width", canvas_width);
    console.log("canvas_height", canvas_height);
    console.log("time_between_pixels", time_between_pixels);
    console.log("color_palette", color_palette);
    console.log("votable_colors", votable_colors);
    console.log("daily_new_colors_count", daily_new_colors_count);
    console.log("start_time", start_time);
    console.log("end_time", end_time);
    console.log("daily_quests_count", daily_quests_count);
    console.log("devmode", devmode);
    console.log("account0 address", account0?.address);
    const initParams = {
      // host: account0?.address,
      canvas_width: cairo.uint256(canvas_width),
      canvas_height: cairo.uint256(canvas_height),
      time_between_pixels,
      color_palette,
      votable_colors,
      daily_new_colors_count,
      start_time,
      end_time,
      daily_quests_count,
      devmode,
    };
    console.log("initParams", initParams);
    const ArtPeaceCalldata = CallData.compile({
      host: account0?.address,
      canvas_width: cairo.uint256(canvas_width),
      canvas_height: cairo.uint256(canvas_height),
      time_between_pixels,
      color_palette,
      votable_colors,
      daily_new_colors_count,
      start_time,
      end_time,
      daily_quests_count,
      devmode,
    });
    const { transaction_hash, contract_address } =
      await account0.deployContract({
        classHash: ArtPeaceClassHash,
        // constructorCalldata:ArtPeaceCalldata
        constructorCalldata: [
          // host ?? account0?.address,
          // cairo.uint256(canvas_width),
          // cairo.uint256(canvas_height),
          canvas_width,
          canvas_height,
          time_between_pixels,
          color_palette,
          votable_colors,
          daily_new_colors_count,
          start_time,
          end_time,
          daily_quests_count,
          devmode,
        ],
        // constructorCalldata: [
        //   initParams
        //   // [
        //   // host ?? account0?.address,
        //   // canvas_width,
        //   // canvas_height,
        //   // time_between_pixels,
        //   // color_palette,
        //   // votable_colors,
        //   // daily_new_colors_count,
        //   // start_time,
        //   // end_time,
        //   // daily_quests_count,
        //   // devmode
        //   // ]

        //   // }

        //   // host?? account0?.address,
        //   // canvas_width,
        //   // canvas_height,
        //   // time_between_pixels,
        //   // color_palette,
        //   // votable_colors,
        //   // daily_new_colors_count,
        //   // start_time,
        //   // end_time,
        //   // daily_quests_count,
        //   // devmode
        // ]
      });

    console.log("transaction_hash", transaction_hash);
    console.log("contract_address", contract_address);
    let tx = await account0?.waitForTransaction(transaction_hash);

    console.log("Tx deploy", tx);
    await provider.waitForTransaction(transaction_hash);
    console.log(
      "✅ New contract Escrow created.\n   address =",
      contract_address
    );

    // const contract = new Contract(compiledSierraAAaccount, contract_address, account0)
    return {
      contract_address,
      tx,
      // contract
    };
  } catch (error) {
    console.log("Error createArtPeace= ", error);
  }
};
