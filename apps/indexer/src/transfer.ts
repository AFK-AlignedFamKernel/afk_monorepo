import { hash, uint256, formatUnits, Block, DECIMALS } from "./deps.ts";

export const config = {
  streamUrl: "https://sepolia.starknet.a5a.ch",
  startingBlock: 10_000,
  network: "starknet",
  filter: {
    header: { weak: true },
    events: [
      {
        fromAddress:
          "0x03e85bfbb8e2a42b7bead9e88e9a1b19dbccf661471061807292120462396ec9",
        keys: [hash.getSelectorFromName("Transfer")],
      },
    ],
  },
  sinkType: "postgres",
  sinkOptions: {
    connectionString: Deno.env.get("POSTGRES_CONNECTION_STRING"),
    tableName: "transfers",
  },
};

export default function transform({ header, events }: Block) {
  const { blockNumber, blockHash, timestamp } = header!;

  return (events ?? []).map(({ event, receipt }) => {
    const { transactionHash } = receipt;
    const transferId = `${transactionHash}_${event.index}`;

    const [fromAddress, toAddress, amountLow, amountHigh] = event.data!;
    const amountRaw = uint256.uint256ToBN({ low: amountLow, high: amountHigh });
    const amount = formatUnits(amountRaw, DECIMALS);

    return {
      network: "starknet-sepolia",
      symbol: "ETH",
      block_hash: blockHash,
      block_number: Number(blockNumber),
      block_timestamp: timestamp,
      transaction_hash: transactionHash,
      transfer_id: transferId,
      from_address: fromAddress,
      to_address: toAddress,
      amount: amount,
      amount_raw: amountRaw.toString(),
    };
  });
}
