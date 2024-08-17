import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
dotenv.config();

import { Account, ProviderInterface, RpcProvider, json } from "starknet";
import { CompiledSierra, CompiledSierraCasm } from "starknet";

export const readContractSierraCasm = (name: string): CompiledSierraCasm =>
  json.parse(
    fs
      .readFileSync(
        path.resolve(
          __dirname,
          `../cairo_contracts/target/dev/cairo_contracts_${name}.compiled_contract_class.json`,
        ),
      )
      .toString("ascii"),
  );

export const readContractSierra = (name: string): CompiledSierra =>
  json.parse(
    fs
      .readFileSync(
        path.resolve(
          __dirname,
          `../cairo_contracts/target/dev/cairo_contracts_${name}.contract_class.json`,
        ),
      )
      .toString("ascii"),
  );

export function getTestProvider(): RpcProvider {
  const providerOptions = {
    nodeUrl: process.env.KATANA_RPC_URL,
    // accelerate the tests when running locally
    ...{ transactionRetryIntervalFallback: 1000 },
  };
  return new RpcProvider(providerOptions);
}

export const getTestAccount = (provider: ProviderInterface) => {
  return new Account(
    provider,
    process.env.KATANA_ACCOUNT_ADDRESS || "",
    process.env.KATANA_PRIVATE_KEY || "",
    "1",
    "0x2",
  );
};
