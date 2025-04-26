import { provider } from "../../utils/starknet";
import { Account, constants, cairo } from "starknet";
import { NOSTR_FI_SCORING_ADDRESS, CLASS_HASH_NOSTR_FI_SCORING } from "../../constants";
import dotenv from "dotenv";
import { createNostrFiScoring } from "../../utils/nostr/nostrfi_scoring";
import { prepareAndConnectContract } from "../../utils/contract";
import { TOKENS_ADDRESS, NAMESPACE_ADDRESS } from "common";
dotenv.config();

export const deployNostrFiScoring = async () => {
  let nostrFiScoring_address: string | undefined = NOSTR_FI_SCORING_ADDRESS[
    constants.StarknetChainId.SN_SEPOLIA
  ] as any; // change default address
  console.log("deploy nostrfi scoring");
  const privateKey0 = process.env.DEV_PK as string;
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
  const account = new Account(provider, accountAddress0, privateKey0, "1");

  const main_token_address = TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK as any;
  const admin_nostr_pubkey = process.env.NOSTR_PUBKEY_ADMIN as string;

  const namespace_address = NAMESPACE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA] as string;

  let nostrFiMetadata = {
    nostr_address: admin_nostr_pubkey,
    name: "NostrFi",
    about: "NostrFi",
    event_id_nip_72: "0",
    event_id_nip_29: "0",
    main_tag: "bitcoin",
  }
  let nostrFiScoring;
  if (process.env.IS_DEPLOY_CONTRACT == "true") {
    let nostrFiScoringContract = await createNostrFiScoring(
      accountAddress0,
      accountAddress0,
      main_token_address,
      admin_nostr_pubkey,
      namespace_address,
      // nostrFiMetadata
    );
    console.log("nostrFiScoring address", nostrFiScoringContract?.contract_address);
    if (nostrFiScoringContract?.contract_address) {
      nostrFiScoring_address = nostrFiScoringContract?.contract_address;
      nostrFiScoring = await prepareAndConnectContract(
        nostrFiScoring_address ?? nostrFiScoringContract?.contract_address,
        account
      );
    }
  } else {
    if (nostrFiScoring_address) {
      nostrFiScoring = await prepareAndConnectContract(
        nostrFiScoring_address,
        account
      );
    }
  }

  /** TODO script to save constants address */

  return {
    nostrFiScoring,
    nostrFiScoring_address,
  };
};

deployNostrFiScoring();
