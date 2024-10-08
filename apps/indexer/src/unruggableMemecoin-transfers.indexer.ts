import { Block, hash, uint256, Pool, formatUnits, DECIMALS } from "./deps.ts";
import { FACTORY_ADDRESS, STARTING_BLOCK } from "./constants.ts";

const ConnectionString = Deno.env.get("POSTGRES_CONNECTION_STRING")!;
const pool = new Pool(ConnectionString, 1, true);
const connection = await pool.connect();

try {
  await connection.queryObject`
    DELETE FROM unrugmeme_transfers
  `;
} finally {
  connection.release();
}

export const config = {
  filter: {
    header: { weak: true },
    events: [
      {
        fromAddress: FACTORY_ADDRESS,
        keys: [hash.getSelectorFromName("MemecoinLaunched")],
        includeReceipt: false,
      },
    ],
  },
  streamUrl: "https://mainnet.starknet.a5a.ch",
  startingBlock: STARTING_BLOCK,
  network: "starknet",
  finality: "DATA_STATUS_ACCEPTED",
  sinkType: "postgres",
  sinkOptions: {
    connectionString: Deno.env.get("POSTGRES_CONNECTION_STRING"),
    tableName: "unrugmeme_transfers",
  },
};

export function factory({ header, events }: Block) {
  const launchEvents = (events ?? []).map(({ event }) => {
    const memecoin_address = event.data?.[0];
    return {
      fromAddress: memecoin_address,
      keys: [hash.getSelectorFromName("Transfer")],
      includeReceipt: false,
    };
  });

  return {
    filter: {
      header: { weak: true },
      events: launchEvents,
    },
  };
}

export default function DecodeUnruggableMemecoinLaunch({
  header,
  events,
}: Block) {
  const { blockNumber, blockHash, timestamp } = header!;

  return (events ?? []).map(({ event, transaction }) => {
    if (!event.data || !event.keys) return;

    const transaction_hash = transaction.meta.hash;
    const transfer_id = `${transaction_hash}_${event.index}`;

    const [from_address, to_address] = event.keys!;

    const [amount_low, amount_high] = event.data;

    const amount_raw = uint256.uint256ToBN({
      low: amount_low,
      high: amount_high,
    });
    const amount = formatUnits(amount_raw, DECIMALS).toString();
    const memecoin_address = event.fromAddress;

    return {
      network: "starknet-mainnet",
      block_hash: blockHash,
      block_number: Number(blockNumber),
      block_timestamp: timestamp,
      transaction_hash,
      transfer_id,
      from_address,
      to_address,
      memecoin_address,
      amount,
      created_at: new Date().toISOString(),
    };
  });
}
