import {
  FACTORY_ADDRESS,
  LAUNCHPAD_ADDRESS,
  STARTING_BLOCK,
} from "./constants.ts";
import { Block, hash, uint256, shortString, Pool } from "./deps.ts";

const ConnectionString = Deno.env.get("POSTGRES_CONNECTION_STRING")!;
const pool = new Pool(ConnectionString, 1, true);
const connection = await pool.connect();

try {
  await connection.queryObject`
    DELETE FROM token_launch
  `;
} finally {
  connection.release();
}

const filter = {
  header: {
    weak: true,
  },
  events: [
    {
      fromAddress: LAUNCHPAD_ADDRESS.SEPOLIA,
      keys: [hash.getSelectorFromName("CreateLaunch")],
      includeReceipt: false,
    },
  ],
};

export const config = {
  streamUrl: "https://sepolia.starknet.a5a.ch",
  startingBlock: STARTING_BLOCK,
  network: "starknet",
  finality: "DATA_STATUS_ACCEPTED",
  filter,
  sinkType: "postgres",
  sinkOptions: {
    connectionString: Deno.env.get("POSTGRES_CONNECTION_STRING"),
    tableName: "token_launch",
  },
};

export default function DecodeTokenLaunchDeploy({ header, events }: Block) {
  const { blockNumber, blockHash, timestamp } = header!;

  return (events ?? []).map(({ event, transaction }) => {
    if (!event.data) return;

    const transactionHash = transaction.meta.hash;

    const [caller, token_address] = event.keys!;
    const [
      amount_low,
      amount_high,
      price,
      total_supply_low,
      total_supply_high,
      slope_low,
      slope_high,
      threshold_liquidity_low,
      threshold_liquidity_high,
    ] = event.data;

    const amount = uint256
      .uint256ToBN({ low: amount_low, high: amount_high })
      .toString();
    const price_decoded = price
      ? shortString.decodeShortString(price.replace(/0x0+/, "0x"))
      : "";
    const total_supply = uint256
      .uint256ToBN({ low: total_supply_low, high: total_supply_high })
      .toString();
    const slope = uint256
      .uint256ToBN({ low: slope_low, high: slope_high })
      .toString();
    const threshold_liquidity = uint256
      .uint256ToBN({
        low: threshold_liquidity_low,
        high: threshold_liquidity_high,
      })
      .toString();

    return {
      memecoin_address: token_address,
      network: "starknet-sepolia",
      block_hash: blockHash,
      block_number: Number(blockNumber),
      block_timestamp: timestamp,
      transaction_hash: transactionHash,
      total_supply,
      price: price_decoded,
      time_stamp: timestamp,
    };
  });
}
