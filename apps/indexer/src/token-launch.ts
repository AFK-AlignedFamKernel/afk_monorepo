import { LAUNCHPAD_ADDRESS, STARTING_BLOCK } from "./constants.ts";
import { Block, hash, uint256, Pool, formatUnits, DECIMALS } from "./deps.ts";

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

    // const [quote_token_address, caller, token_address] = event.keys!;
    const [_, caller, token_address, quote_token_address] = event.keys;

    const [
      amount_low,
      amount_high,
      price_low,
      price_high,
      total_supply_low,
      total_supply_high,
      slope_low,
      slope_high,
      threshold_liquidity_low,
      threshold_liquidity_high,
    ] = event.data;

    const amount_raw = uint256.uint256ToBN({
      low: amount_low,
      high: amount_high,
    });
    const _amount = formatUnits(amount_raw, DECIMALS).toString();

    const price_raw = uint256.uint256ToBN({
      low: price_low,
      high: price_high,
    });
    const price = formatUnits(price_raw, DECIMALS).toString();

    const total_supply_raw = uint256.uint256ToBN({
      low: total_supply_low,
      high: total_supply_high,
    });
    const total_supply = formatUnits(total_supply_raw, DECIMALS).toString();

    const slope_raw = uint256.uint256ToBN({ low: slope_low, high: slope_high });
    const _slope = formatUnits(slope_raw, DECIMALS).toString();

    const threshold_liquidity_raw = uint256.uint256ToBN({
      low: threshold_liquidity_low,
      high: threshold_liquidity_high,
    });
    const _threshold_liquidity = formatUnits(threshold_liquidity_raw, DECIMALS);

    console.log({
      memecoin_address: token_address,
      quote_token: quote_token_address,
      caller: caller,
    });

    return {
      owner_address: caller,
      quote_token: quote_token_address,
      memecoin_address: token_address,
      network: "starknet-sepolia",
      block_hash: blockHash,
      block_number: Number(blockNumber),
      block_timestamp: timestamp,
      transaction_hash: transactionHash,
      quote_token: quote_token_address,
      total_supply,
      price,
      created_at: new Date().toISOString(),
      threshold_liquidity: _threshold_liquidity,
    };
  });
}
