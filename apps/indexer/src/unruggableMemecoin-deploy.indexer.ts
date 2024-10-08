import {
  Block,
  hash,
  shortString,
  uint256,
  Pool,
  formatUnits,
  DECIMALS,
} from "./deps.ts";
import { FACTORY_ADDRESS, STARTING_BLOCK } from "./constants.ts";

const ConnectionString = Deno.env.get("POSTGRES_CONNECTION_STRING")!;
const pool = new Pool(ConnectionString, 1, true);
const connection = await pool.connect();

try {
  await connection.queryObject`
    DELETE FROM unrugmeme_deploy
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
      fromAddress: FACTORY_ADDRESS,
      keys: [hash.getSelectorFromName("MemecoinCreated")],
      includeReceipt: false,
    },
  ],
};

export const config = {
  streamUrl: "https://mainnet.starknet.a5a.ch",
  startingBlock: STARTING_BLOCK,
  network: "starknet",
  finality: "DATA_STATUS_ACCEPTED",
  filter,
  sinkType: "postgres",
  sinkOptions: {
    connectionString: Deno.env.get("POSTGRES_CONNECTION_STRING"),
    tableName: "unrugmeme_deploy",
  },
};

export default function DecodeUnruggableMemecoinDeploy({
  header,
  events,
}: Block) {
  const { blockNumber, blockHash, timestamp } = header!;

  return (events ?? []).map(({ event, transaction }) => {
    if (!event.data) return;

    const transactionHash = transaction.meta.hash;

    const [
      owner,
      name,
      symbol,
      initial_supply_low,
      initial_supply_high,
      memecoin_address,
    ] = event.data;

    const name_decoded = shortString.decodeShortString(
      name.replace(/0x0+/, "0x")
    );
    const symbol_decoded = shortString.decodeShortString(
      symbol.replace(/0x0+/, "0x")
    );
    const initial_supply_raw = uint256.uint256ToBN({
      low: initial_supply_low,
      high: initial_supply_high,
    });
    const initial_supply = formatUnits(initial_supply_raw, DECIMALS).toString();

    return {
      network: "starknet-mainnet",
      block_hash: blockHash,
      block_number: Number(blockNumber),
      block_timestamp: timestamp,
      transaction_hash: transactionHash,
      memecoin_address: memecoin_address,
      owner_address: owner,
      name: name_decoded,
      symbol: symbol_decoded,
      initial_supply,
      created_at: new Date().toISOString(),
    };
  });
}
