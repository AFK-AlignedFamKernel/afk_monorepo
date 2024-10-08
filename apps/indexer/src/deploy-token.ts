import { LAUNCHPAD_ADDRESS, STARTING_BLOCK } from "./constants.ts";
import {
  Block,
  DECIMALS,
  formatUnits,
  hash,
  uint256,
  shortString,
  Pool,
} from "./deps.ts";

const ConnectionString = Deno.env.get("POSTGRES_CONNECTION_STRING")!;
const pool = new Pool(ConnectionString, 1, true);
const connection = await pool.connect();

try {
  await connection.queryObject`
    DELETE FROM token_deploy
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
      keys: [hash.getSelectorFromName("CreateToken")],
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
    tableName: "token_deploy",
  },
};

export default function DecodeTokenDeploy({ header, events }: Block) {
  const { blockNumber, blockHash, timestamp } = header!;

  return (events ?? []).map(({ event, transaction }) => {
    if (!event.data || !event.keys) return;

    const transactionHash = transaction.meta.hash;
    const [_, caller, token_address] = event.keys;

    const [
      symbol,
      name,
      initial_supply_low,
      initial_supply_high,
      total_supply_low,
      total_supply_high,
    ] = event.data;

    const symbol_decoded = token_address
      ? shortString.decodeShortString(symbol.replace(/0x0+/, "0x"))
      : "";

    const name_decoded = name
      ? shortString.decodeShortString(name.replace(/0x0+/, "0x"))
      : "";

    const initial_supply_raw = uint256.uint256ToBN({
      low: initial_supply_low,
      high: initial_supply_high,
    });
    const initial_supply = formatUnits(initial_supply_raw, DECIMALS).toString();

    const total_supply_raw = uint256.uint256ToBN({
      low: total_supply_low,
      high: total_supply_high,
    });
    const total_supply = formatUnits(total_supply_raw, DECIMALS).toString();

    console.log({
      memecoin_address: token_address,
      caller: caller,
    });

    return {
      memecoin_address: token_address,
      network: "starknet-sepolia",
      block_hash: blockHash,
      block_number: Number(blockNumber),
      block_timestamp: timestamp,
      transaction_hash: transactionHash,
      owner_address: caller,
      name: name_decoded,
      symbol: symbol_decoded,
      initial_supply,
      total_supply,
      created_at: new Date().toISOString(),
    };
  });
}
