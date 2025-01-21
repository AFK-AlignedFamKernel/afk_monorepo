import { provider } from "../../utils/starknet";
import { Account, constants, CallData, cairo, CairoCustomEnum } from "starknet";
import dotenv from "dotenv";
import { USERNAME_STORE_ADDRESS, ART_PEACE_ADDRESS, TOKENS_ADDRESS, formatFloatToUint256} from "common";
import { prepareAndConnectContract } from "../../utils/contract";
import { createQuest } from "../../utils/quest";
dotenv.config();

export const shieldSetup = async () => {
  let username_store_address: string | undefined = USERNAME_STORE_ADDRESS[
    constants.StarknetChainId.SN_SEPOLIA
  ] as any; // change default address
  const privateKey0 = process.env.DEV_PK as string;
  const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;
  const account = new Account(provider, accountAddress0, privateKey0, "1");

  /** TODO script to save constants address */

  const artPeaceContractAddress = ART_PEACE_ADDRESS[constants.StarknetChainId.SN_SEPOLIA] as string;
  const art_peace = await prepareAndConnectContract(
    artPeaceContractAddress,
    account
  );


  // Loop into Chain faction files

  // const calls = []



  // const feltName = cairo.felt(String(chain))
  let shieldEnum = new CairoCustomEnum({BuyTime: {}});

  const initShield = {
    contractAddress: artPeaceContractAddress,
    entrypoint: 'activate_pixel_shield',
    calldata: CallData.compile({
    }),
  };

  // const initShieldType = {
  //   contractAddress: artPeaceContractAddress,
  //   entrypoint: 'set_shield_type',
  //   calldata: CallData.compile({
  //   }),
  // };


  const blockTimestamp = await provider.getBlockNumber();

  let amountNumber = 0.0001;
  let amountNumberMnute = amountNumber * 60;
  let amount_to_paid= formatFloatToUint256(amountNumber)
  let amount_to_paid_seconds= formatFloatToUint256(amountNumber)
  let amount_to_paid_minute= formatFloatToUint256(amountNumberMnute)
  let tokenAddress = TOKENS_ADDRESS[constants.StarknetChainId.SN_SEPOLIA].STRK
  const adminShieldParams = {
    contractAddress: artPeaceContractAddress,
    entrypoint: 'set_shield_type_with_shield_params',
    calldata: CallData.compile({
      shield_type:shieldEnum,
      shield_params:{
        timestamp: blockTimestamp,
        shield_type: shieldEnum,
        until: 30,
        amount_to_paid: amount_to_paid,
        cost_per_second: amount_to_paid_seconds,
        cost_per_minute: amount_to_paid_minute,
        to_address: account?.address,
        buy_token_address: tokenAddress
      }
    }),
  };

  const tx = await account.execute([
    initShield,
    // initShieldType,
    adminShieldParams])

  console.log("tx", tx)

  return {
  };
};

shieldSetup();
