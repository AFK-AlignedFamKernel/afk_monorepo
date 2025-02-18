import {
  Account,
  json,
  CallData,
  Contract,
  cairo,
  uint256,
  Uint256,
} from "starknet";
import fs from "fs";
import dotenv from "dotenv";
import { provider } from "./starknet";
import path from "path";

dotenv.config();

const PATH_KEY_MARKETPLACE = path.resolve(
  __dirname,
  "../../onchain/cairo/target/dev/afk_KeysMarketplace.contract_class.json"
);
const PATH_KEY_MARKETPLACE_COMPILED = path.resolve(
  __dirname,
  "../../onchain/cairo/target/dev/afk_KeysMarketplace.compiled_contract_class.json"
);

/** @TODO spec need to be discuss. This function serve as an example */
export const createKeysMarketplace = async (
  token_address: string,
  initial_key_price: number,
  step_linear_increase: number
) => {
  try {
    // initialize existing predeployed account 0 of Devnet
    const privateKey0 = process.env.DEV_PK as string;
    const accountAddress0 = process.env.DEV_PUBLIC_KEY as string;

    // Devnet or Sepolia account
    const account0 = new Account(provider, accountAddress0, privateKey0, "1");
    let KeysClassHash = process.env.KEY_CLASS_HASH as string;

    const compiledCasm = json.parse(
      fs.readFileSync(PATH_KEY_MARKETPLACE_COMPILED).toString("ascii")
    );
    const compiledSierraAAaccount = json.parse(
      fs.readFileSync(PATH_KEY_MARKETPLACE).toString("ascii")
    );
    // const AAaccount = new Account(provider, AAcontractAddress, AAprivateKey);
    /** @description uncomment this to declare your account */
    // console.log("declare account");

    if (process.env.REDECLARE_CONTRACT == "true") {
      try {
        console.log("try declare key marketplace");
        // const declareResponse = await account0.declare({
        //   contract: compiledSierraAAaccount,
        //   casm: compiledCasm,
        // });

        const estimate = await account0.estimateDeclareFee({
          contract: compiledSierraAAaccount,
          casm: compiledCasm,
        });
        console.log("Declare estimate", estimate);

        const declareResponse = await account0.declare(
          {
            contract: compiledSierraAAaccount,
            casm: compiledCasm,

            // {
            //   maxFee:estimate.suggestedMaxFee
            // }
          },
          {
            // maxFee: estimate.suggestedMaxFee * BigInt(3)
          }
        );

        console.log("Declare deploy", declareResponse?.transaction_hash);
        await provider.waitForTransaction(declareResponse?.transaction_hash);
        const contractClassHash = declareResponse.class_hash;
        console.log("contractClassHash", contractClassHash);
        KeysClassHash = contractClassHash;

        const nonce = await account0?.getNonce();
        console.log("nonce", nonce);

        console.log("KeysClassHash", KeysClassHash);
      } catch (e) {
        console.log("Error declare key marketplace", e);
        return;
      }
    }
    let total_amount_float = initial_key_price ?? 0.01;

    let decimals = 18;
    let total_amount: Uint256 | undefined;
    const total_amount_nb = total_amount_float * 10 ** Number(decimals);

    if (Number.isInteger(total_amount_nb)) {
      total_amount = cairo.uint256(total_amount_nb);
    } else if (!Number.isInteger(total_amount_nb)) {
      total_amount = uint256.bnToUint256(BigInt(total_amount_nb));
    }

    let step__float = step_linear_increase ?? 0.01;

    let total_step_linear_increase: Uint256 | undefined;
    const total_step_linear_increase_nb = step__float * 10 ** Number(decimals);

    if (Number.isInteger(total_step_linear_increase_nb)) {
      total_step_linear_increase = cairo.uint256(total_step_linear_increase_nb);
    } else if (!Number.isInteger(total_step_linear_increase_nb)) {
      total_step_linear_increase = uint256.bnToUint256(
        BigInt(total_step_linear_increase_nb)
      );
    }

    const { transaction_hash, contract_address } =
      await account0.deployContract({
        classHash: KeysClassHash,
        constructorCalldata: [
          account0?.address,
          total_amount ?? cairo.uint256(1),
          token_address as `0x${string}`,
          total_step_linear_increase ?? cairo.uint256(1),
          // uint256.bnToUint256(BigInt("0x"+initial_key_price))
          // cairo.uint256(1)
          // uint256.bnToUint256(BigInt(initial_key_price))
        ],
      });

    console.log("transaction_hash", transaction_hash);
    console.log("contract_address", contract_address);
    let tx = await account0?.waitForTransaction(transaction_hash);

    console.log("Tx deploy", tx);
    await provider.waitForTransaction(transaction_hash);
    console.log(
      "✅ New contract Keys created.\n   address =",
      contract_address
    );

    return {
      contract_address,
      tx,
      // contract
    };
  } catch (error) {
    console.log("Error createEscrowAccount= ", error);
  }
};

export const buyKeys = async (props: {
  key_contract: Contract;
  user_address: string;
  account: Account;
  amount: number;
  tokenAddress: string;
}) => {
  try {
    const { key_contract, account, amount, tokenAddress, user_address } = props;
    const buyKeysParams = {
      user_address: user_address, // token address
      amount: cairo.uint256(amount), // amount int. Float need to be convert with bnToUint
    };
    console.log("buyKeysParams", buyKeysParams);
    const tx = await account.execute({
      contractAddress: key_contract?.address,
      entrypoint: "buy_keys",
      calldata: [buyKeysParams.user_address, buyKeysParams.amount],
    });

    await account.waitForTransaction(tx.transaction_hash);

    return tx;
  } catch (e) {
    console.log("Error buy_keys key_contract", e);
  }
};

export const sellKeys = async (props: {
  key_contract: Contract;
  user_address: string;
  account: Account;
  amount: number;
  tokenAddress: string;
}) => {
  try {
    const { key_contract, account, amount, tokenAddress, user_address } = props;
    const sellKeysParams = {
      user_address: user_address, // token address
      amount: cairo.uint256(amount), // amount int. Float need to be convert with bnToUint
    };
    console.log("sellKeysParams", sellKeysParams);
    const tx = await account.execute({
      contractAddress: key_contract?.address,
      entrypoint: "sell_keys",
      calldata: [sellKeysParams.user_address, sellKeysParams.amount],
    });

    await account.waitForTransaction(tx.transaction_hash);

    return tx;
  } catch (e) {
    console.log("Error sellKeysParams key_contract", e);
  }
};

export const instantiateKeys = async (
  account: Account,
  key_marketplace: Contract
  // tokenAddress: string,
) => {
  try {
    let call = {
      contractAddress: key_marketplace?.address,
      entrypoint: "instantiate_keys",
      calldata: CallData.compile({}),
    };

    console.log("Call", call);

    let tx = await account?.execute([call], undefined, {});
    console.log("tx hash", tx.transaction_hash);
    let wait_tx = await account?.waitForTransaction(tx?.transaction_hash);

    return wait_tx;
  } catch (e) {
    console.log("Error instantiateKeys", e);
  }
};
