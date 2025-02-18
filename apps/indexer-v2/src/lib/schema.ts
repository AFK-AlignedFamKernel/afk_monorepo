import { bigint, pgTable, text, uuid } from "drizzle-orm/pg-core";

export const starknetUsdcTransfers = pgTable("starknet_usdc_transfers", {
  _id: uuid("_id").primaryKey().defaultRandom(),
  number: bigint("number", { mode: "number" }),
  hash: text("hash"),
});

export const ethereumUsdcTransfers = pgTable("ethereum_usdc_transfers", {
  _id: uuid("_id").primaryKey().defaultRandom(),
  number: bigint("number", { mode: "number" }),
  hash: text("hash"),
});

export const daoCreation = pgTable("dao_creation", {
  _id: uuid("_id").primaryKey().defaultRandom(),
  number: bigint("number", { mode: "number" }),
  hash: text("hash"),
  creator: text("creator"),
  tokenAddress: text("token_address"),
  contractAddress: text("contract_address"),
});