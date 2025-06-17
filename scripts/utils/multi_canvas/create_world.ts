import {
  Account,
  json,
  Contract,
  cairo,
  uint256,
  byteArray,
  CallData,
  constants,
} from "starknet";
import fs from "fs";
import dotenv from "dotenv";
import { provider } from "../starknet";
import path from "path";
import { finalizeEvent } from "nostr-tools";
import { CanvasConfig, MULTI_CANVAS_ADDRESS } from "common";
import { prepareAndConnectContract } from "../../utils/social_account";

dotenv.config();
const PATH_ART_PEACE = path.resolve(
  __dirname,
  "../../../onchain/cairo/games/target/dev/afk_games_MultiCanvas.contract_class.json"
);
const PATH_ART_PEACE_COMPILED = path.resolve(
  __dirname,
  "../../../onchain/cairo/games/target/dev/afk_games_MultiCanvas.compiled_contract_class.json"
);

/** @TODO spec need to be discuss. This function serve as an example */
export const createWorld = async (
  host: string,
  name: string,
  unique_name: string,
  canvas_width: number,
  canvas_height: number,
  pixels_per_time: number,
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
      host: account0?.address ?? accountAddress0,
      name: name ?? cairo.felt("AFK_bro"),
      unique_name: unique_name ?? cairo.felt("AFK_bro"),
      width: canvas_width,
      height: canvas_height,
      pixels_per_time: pixels_per_time,
      time_between_pixels: time_between_pixels,
      color_palette: color_palette,
      start_time: start_time,
      end_time: end_time,
    };
    console.log("initParams", initParams);

    let addressHost = account0?.address;
    // const ArtPeaceCalldata = CallData.compile({
    //   host: account0?.address,
    //   name:cairo.felt(name),
    //   unique_name:cairo.felt(unique_name),
    //   canvas_width: cairo.uint256(canvas_width),
    //   canvas_height: cairo.uint256(canvas_height),
    //   time_between_pixels,
    //   // votable_colors,
    //   daily_new_colors_count,
    //   color_palette,
    //   start_time,
    //   end_time,
    //   // daily_quests_count,
    //   // devmode,
    // });

    // console.log("ArtPeaceCalldata", ArtPeaceCalldata);
    // const transaction_hash = await account0.execute([
    //   {
    //     contractAddress: MULTI_CANVAS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
    //     entrypoint: "create_canvas",
    //     calldata: [CallData.compile(initParams)],
    //     // calldata: [{...initParams}],
    //     // calldata: [initParams],
    //     // calldata: CallData.compile([
    //     //   ArtPeaceCalldata
    //     //   // {

    //     //   // }

    //     // ])
    //     // calldata: CallData.compile([
    //     //   account0?.address ?? accountAddress0, 
    //     //   cairo.felt("AFK WORLD"),
    //     //   cairo.felt("AFK WORLD"),
    //     //   cairo.uint256(canvas_width),
    //     //   cairo.uint256(canvas_height),
    //     //   cairo.uint256(pixels_per_time),
    //     //   time_between_pixels,
    //     //   color_palette,
    //     //   votable_colors,
    //     //   daily_new_colors_count,
    //     //   start_time,
    //     //   end_time,
    //     //   daily_quests_count,
    //     //   devmode,
    //     // ])
    //     // [
    //     //   CallData.compile(initParams)
    //     //   // {
    //     //   //   addressHost,
    //     //   //   name,
    //     //   //   unique_name,
    //     //   //   canvas_width,
    //     //   //   canvas_height,
    //     //   //   time_between_pixels,
    //     //   //   color_palette,
    //     //   //   votable_colors,
    //     //   //   daily_new_colors_count,
    //     //   //   start_time,
    //     //   //   end_time,
    //     //   //   daily_quests_count,
    //     //   //   devmode,
    //     //   // }
    //     // ],

    //   }])


    const contract = await prepareAndConnectContract(MULTI_CANVAS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA], account0);

    const transaction_hash = await contract.create_canvas(initParams)
    // const transaction_hash = await account0.execute([
    //   {
    //     contractAddress: MULTI_CANVAS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA],
    //     entrypoint: "create_canvas",
    //     calldata: [CallData.compile(initParams)],
    //     // calldata: [{...initParams}],
    //     // calldata: [initParams],
    //     // calldata: CallData.compile([
    //     //   ArtPeaceCalldata
    //     //   // {

    //     //   // }

    //     // ])
    //     // calldata: CallData.compile([
    //     //   account0?.address ?? accountAddress0, 
    //     //   cairo.felt("AFK WORLD"),
    //     //   cairo.felt("AFK WORLD"),
    //     //   cairo.uint256(canvas_width),
    //     //   cairo.uint256(canvas_height),
    //     //   cairo.uint256(pixels_per_time),
    //     //   time_between_pixels,
    //     //   color_palette,
    //     //   votable_colors,
    //     //   daily_new_colors_count,
    //     //   start_time,
    //     //   end_time,
    //     //   daily_quests_count,
    //     //   devmode,
    //     // ])
    //     // [
    //     //   CallData.compile(initParams)
    //     //   // {
    //     //   //   addressHost,
    //     //   //   name,
    //     //   //   unique_name,
    //     //   //   canvas_width,
    //     //   //   canvas_height,
    //     //   //   time_between_pixels,
    //     //   //   color_palette,
    //     //   //   votable_colors,
    //     //   //   daily_new_colors_count,
    //     //   //   start_time,
    //     //   //   end_time,
    //     //   //   daily_quests_count,
    //     //   //   devmode,
    //     //   // }
    //     // ],

    //   }])

    console.log("transaction_hash", transaction_hash);
    // let tx = await account0?.waitForTransaction(transaction_hash);

    // console.log("Tx deploy", tx);
    // await provider.waitForTransaction(transaction_hash);
    // console.log(
    //   "✅ New contract Escrow created.\n   address =",
    //   contract_address
    // );

    // const contract = new Contract(compiledSierraAAaccount, contract_address, account0)
    return {
      transaction_hash,
    };
  } catch (error) {
    console.log("Error createArtPeace= ", error);
  }
};
