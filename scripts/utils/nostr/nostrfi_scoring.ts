import { Account, json, Contract, cairo, uint256, byteArray } from "starknet";
import fs from "fs";
import dotenv from "dotenv";
import { provider } from "../starknet";
import path from "path";
import { finalizeEvent } from "nostr-tools";
import { pubkeyToUint256 } from "utils/format";

dotenv.config();
const PATH_SOCIAL_ACCOUNT = path.resolve(
  __dirname,
  "../../../onchain/cairo/afk/target/dev/afk_NostrFiScoring.contract_class.json"
);
const PATH_SOCIAL_ACCOUNT_COMPILED = path.resolve(
  __dirname,
  "../../../onchain/cairo/afk/target/dev/afk_NostrFiScoring.compiled_contract_class.json"
);


interface NostrFiMetadata {
  name: string;
  about: string;
  nostr_address: string;
  event_id_nip_72: string;
  event_id_nip_29: string;
}
/** @TODO spec need to be discuss. This function serve as an example */
export const createNostrFiScoring = async (
  admin: string,
  deployer: string,
  main_token_address: string,
  admin_nostr_pubkey: string,
  namespace_address: string,
  metadata?: NostrFiMetadata
) => {
  try {
    // initialize existing predeployed account 0 of Devnet
    const privateKey0 = process.env.DEV_PK as string;
    const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;

    // Devnet or Sepolia account
    const account0 = new Account(provider, accountAddress0, privateKey0, "1");
    let NostrFiScoringClassHash = process.env.NOSTR_FI_SCORING_CLASS_HASH as string;

    const compiledSierraAAaccount = json.parse(
      fs.readFileSync(PATH_SOCIAL_ACCOUNT).toString("ascii")
    );
    const compiledAACasm = json.parse(
      fs.readFileSync(PATH_SOCIAL_ACCOUNT_COMPILED).toString("ascii")
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
      const declareResponse = await account0.declareIfNot({
        contract: compiledSierraAAaccount,
        casm: compiledAACasm,
      });
      console.log("Declare deploy", declareResponse);
      if(declareResponse?.transaction_hash){
        await provider.waitForTransaction(declareResponse?.transaction_hash);
        const contractClassHash = declareResponse.class_hash;
          NostrFiScoringClassHash = contractClassHash;
      }

      const nonce = await account0?.getNonce();
      console.log("nonce", nonce);
    }

    let nostrMetadata = null;
    if (metadata) {
      nostrMetadata = {
        name: byteArray.byteArrayFromString(metadata.name),
        about: byteArray.byteArrayFromString(metadata.about),
        nostr_address: cairo.uint256(BigInt("0x" + metadata.nostr_address)),
        event_id_nip_72: cairo.uint256(BigInt("0x" + metadata.event_id_nip_72)),
        event_id_nip_29: cairo.uint256(BigInt("0x" + metadata.event_id_nip_29)),
      }
    } else {
      nostrMetadata = {
        name: byteArray.byteArrayFromString(""),
        about: byteArray.byteArrayFromString(""),
        nostr_address: cairo.uint256("0x"),
        event_id_nip_72: cairo.uint256("0x1"),
        event_id_nip_29: cairo.uint256("0x1"),
      }
    }
    // const admin_nostr_pubkey_uint = pubkeyToUint256(admin_nostr_pubkey);
    const public_key = uint256.bnToUint256(BigInt("0x" + admin_nostr_pubkey));

    const { transaction_hash, contract_address } =
      await account0.deployContract({
        classHash: NostrFiScoringClassHash,
        constructorCalldata: [
          admin,
          deployer,
          main_token_address,
          public_key,
          namespace_address,
          nostrMetadata
        ],
      });

    console.log("transaction_hash", transaction_hash);
    console.log("contract_address", contract_address);
    let tx = await account0?.waitForTransaction(transaction_hash);

    console.log("Tx deploy", tx);
    await provider.waitForTransaction(transaction_hash);
    console.log(
      "✅ New contract NostrFiScoring created.\n   address =",
      contract_address
    );

    // const contract = new Contract(compiledSierraAAaccount, contract_address, account0)
    return {
      contract_address,
      tx,
      // contract
    };
  } catch (error) {
    console.log("Error createNostrFiScoring= ", error);
  }
};
