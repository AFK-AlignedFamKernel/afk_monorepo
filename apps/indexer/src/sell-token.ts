import { Block, hash, uint256 } from "./deps.ts";
import { STARTING_BLOCK, LAUNCHPAD_ADDRESS } from "./constants.ts";

const filter = {
  header: {
    weak: true
  },
  events: [
    {
      fromAddress: LAUNCHPAD_ADDRESS.SEPOLIA,
      keys: [hash.getSelectorFromName("SellToken")],
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
    connectionString: "", // Your PostgreSQL connection string
    tableName: "token_transactions" // Using the same table for buy and sell
  }
};

export default function DecodeSellToken({ header, events }: Block) {
  const { blockNumber, blockHash, timestamp } = header!;

  return (events ?? []).map(({ event, transaction }) => {
    if (!event.data) return;

    const transactionHash = transaction.meta.hash;
    const [
      seller,
      token_address,
      amount_low,
      amount_high,
      price_low,
      price_high,
      protocol_fee_low,
      protocol_fee_high,
      total_supply_low,
      total_supply_high
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
    const total_supply = uint256
      .uint256ToBN({ low: total_supply_low, high: total_supply_high })
      .toString();

    return {
      transaction_type: "sell",
      network: "starknet-sepolia",
      block_hash: blockHash,
      block_number: Number(blockNumber),
      block_timestamp: timestamp,
      transaction_hash: transactionHash,
      memecoin_address: token_address,
      owner_address: seller,
      last_price: price,
      quote_amount: "",
      coin_received: "",
      initial_supply: "",
      total_supply,
      price,
      amount,
      timestamp: new Date(Number(timestamp) * 1000).toISOString(),
      created_at: new Date().toISOString()
    };
  });
}
