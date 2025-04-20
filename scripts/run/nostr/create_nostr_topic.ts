import { provider } from "../../utils/starknet";
import { Account, constants, CallData, cairo, uint256, byteArray } from "starknet";
import dotenv from "dotenv";
import { FACTORY_SCORE_ADDRESS, TOKENS_ADDRESS } from "common";
dotenv.config();

export const TOPICS_NAME = [
  "cypherpunk",
  "content creator economy",
  // "bitcoin",
  // "ethereum",
  // "art",
  // "zk",
  // "artificial intelligence",
  // "crypto",
  // "marketing"
]
export const deployAllChainFactionAdmin = async () => {
  const privateKey0 = process.env.DEV_PK as string;
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
  const account = new Account(provider, accountAddress0, privateKey0, "1");

  /** TODO script to save constants address */

  const scorefiFactoryContractAddress = FACTORY_SCORE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA] as string;

  // Loop into Chain faction files

  const calls = []

  const admin_nostr_pubkey = process.env.NOSTR_PUBKEY_ADMIN as string;

  const public_key = uint256.bnToUint256(BigInt("0x" + admin_nostr_pubkey));

  const token_address = TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK as string;
  for (let i = 0; i < TOPICS_NAME.length; i++) {
    let nostrFiMetadata = {
      nostr_address: public_key,
      name: byteArray.byteArrayFromString(TOPICS_NAME[i]),
      about: byteArray.byteArrayFromString(TOPICS_NAME[i]),
      event_id_nip_72: uint256.bnToUint256(BigInt(0)),
      event_id_nip_29: uint256.bnToUint256(BigInt(0)),
      main_tag: byteArray.byteArrayFromString(TOPICS_NAME[i]),
    }
    const initChainCall = {
      contractAddress: scorefiFactoryContractAddress,
      entrypoint: 'create_nostr_topic',
      calldata: CallData.compile({
        admin: accountAddress0,
        admin_nostr_pubkey: public_key,
        main_token_address: token_address,
        contract_address_salt: cairo.felt(new Date().getTime().toString()),
        nostr_metadata: nostrFiMetadata
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
