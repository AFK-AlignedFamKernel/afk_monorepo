import { Block, hash, uint256, Pool } from "./deps.ts";
import { STARTING_BLOCK, LAUNCHPAD_ADDRESS } from "./constants.ts";

const ConnectionString = Deno.env.get("POSTGRES_CONNECTION_STRING")!
const pool = new Pool(ConnectionString, 1, true);
const connection = await pool.connect();

try {
  await connection.queryObject`
    DELETE FROM token_transactions WHERE transaction_type = 'buy'
  `;
} finally {
  connection.release();
}

const filter = {
  header: {
    weak: true
  },
  events: [
    {
      fromAddress: LAUNCHPAD_ADDRESS.SEPOLIA,
      keys: [hash.getSelectorFromName("BuyToken")],
      includeReceipt: false
    }
  ]
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
    tableName: "token_transactions"
  }
};

export default function DecodeBuyToken({ header, events }: Block) {
  const { blockNumber, blockHash, timestamp: block_timestamp } = header!;

  return (events ?? []).map(({ event, transaction }) => {
    if (!event.data) return;

    const transactionHash = transaction.meta.hash;
    const transfer_id = `${transactionHash}_${event.index}`;

    const [caller, token_address] = event.keys!;

    const [
      amount_low,
      amount_high,
      price_low,
      price_high,
      protocol_fee_low,
      protocol_fee_high,
      last_price_low,
      last_price_high,
      timestamp,
      quote_amount_low,
      quote_amount_high
    ] = event.data;

    const amount = uint256
      .uint256ToBN({ low: amount_low, high: amount_high })
      .toString();
    const price = uint256
      .uint256ToBN({ low: price_low, high: price_high })
      .toString();
    const protocol_fee = uint256
      .uint256ToBN({ low: protocol_fee_low, high: protocol_fee_high })
      .toString();
    const last_price = uint256
      .uint256ToBN({ low: last_price_low, high: last_price_high })
      .toString();
    const quote_amount = uint256
      .uint256ToBN({ low: quote_amount_low, high: quote_amount_high })
      .toString();

    return {
      transfer_id,
      network: "starknet-sepolia",
      block_hash: blockHash,
      block_number: Number(blockNumber),
      block_timestamp: block_timestamp,
      transaction_hash: transactionHash,
      memecoin_address: token_address,
      owner_address: caller,
      last_price,
      quote_amount,
      price,
      amount,
      protocol_fee,
      time_stamp: timestamp,
      transaction_type: "buy"
    };
  });
}