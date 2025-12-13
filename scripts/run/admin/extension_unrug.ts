import { provider } from "../../utils/starknet";
import { Account, cairo, CallData, constants, uint256 } from "starknet";
// import { CLASS_HASH, ESCROW_ADDRESS, JEDISWAP_V2_FACTORY, JEDISWAP_V2_NFT_ROUTER, TOKENS_ADDRESS, } from "../constants";
import dotenv from "dotenv";
import { prepareAndConnectContract } from "../../utils/contract";
import { createUnrugLiquidity } from "../../utils/unrug_liquidity";
import { formatFloatToUint256, EKUBO_CORE, EKUBO_POSITION, UNRUGGABLE_FACTORY_ADDRESS, EKUBO_REGISTRY, UNRUGGABLE_LIQUIDITY_ADDRESSES, LAUNCHPAD_ADDRESS, CLASS_HASH_INTERNAL_SWAP_POOL } from "common";
import {
  CLASS_HASH,
  ESCROW_ADDRESS,
  JEDISWAP_V2_FACTORY,
  JEDISWAP_V2_NFT_ROUTER,
  TOKENS_ADDRESS,
} from "common";

dotenv.config();

export const manageExtensionUnrug = async () => {
  console.log("deployUnrugLiquidity");


  let unrugContract;
  const UNRUG_ADDRESS =
    UNRUGGABLE_LIQUIDITY_ADDRESSES[constants.StarknetChainId.SN_SEPOLIA];
  const privateKey0 = process.env.DEV_PK as string;
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
  const account = new Account(provider, accountAddress0, privateKey0, "1");

  // const chainId = await provider.getChainId();
  // const TOKEN_QUOTE_ADDRESS= TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK;
  const TOKEN_QUOTE_ADDRESS =
    TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK;


  const TOKEN_CLASS_HASH =
    CLASS_HASH.TOKEN[constants.StarknetChainId.SN_SEPOLIA];

    const classHashInternalSwapPool =
    CLASS_HASH_INTERNAL_SWAP_POOL[constants.StarknetChainId.SN_SEPOLIA];  
  if (process.env.IS_DEPLOY_CONTRACT == "true") {
  
    if (UNRUG_ADDRESS) {
      unrugContract = await prepareAndConnectContract(
        UNRUG_ADDRESS ?? UNRUG_ADDRESS,
        account
      );

      console.log("unrugContract", unrugContract);

      // await unrugContract.functions.set_ekubo_extension_class_hash(classHashInternalSwapPool);
      // await unrugContract.functions.set_is_extensions_enabled(true);

      const extensionUnrugCall = {
        contractAddress: UNRUG_ADDRESS,
        entrypoint: 'set_ekubo_extension_class_hash',
        calldata: CallData.compile({
          classHashInternalSwapPool: classHashInternalSwapPool,
        }),
        // calldata: [buyKeysParams.user_address, buyKeysParams.amount]
      };

      const extensionUnrugCallExtension = {
        contractAddress: UNRUG_ADDRESS,
        entrypoint: 'set_is_extensions_enabled',
        calldata: CallData.compile({
          is_extensions_enabled: true,
        }),
      };

     const tx = await account.execute([extensionUnrugCall, extensionUnrugCallExtension]);
     console.log("tx", tx);

     await account.waitForTransaction(tx.transaction_hash);


    }
  } else {
  }

  /** TODO script to save constants address */

  return {
    unrugContract,
    UNRUG_ADDRESS,
  };
};

manageExtensionUnrug();
