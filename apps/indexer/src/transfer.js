import { hash, uint256 } from "https://esm.run/starknet@5.14";
import { formatUnits } from "https://esm.run/viem@1.4";

const DECIMALS = 18;

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
    tableName: "transfers",
  },
};

export default function transform({ header, events }) {
  const { blockNumber, blockHash, timestamp } = header;
  return events.map(({ event, receipt }) => {
    const { transactionHash } = receipt;
    const transferId = `${transactionHash}_${event.index}`;

    const [fromAddress, toAddress, amountLow, amountHigh] = event.data;
    const amountRaw = uint256.uint256ToBN({ low: amountLow, high: amountHigh });
    const amount = formatUnits(amountRaw, DECIMALS);

    // Convert to snake_case because it works better with postgres.
    return {
      network: "starknet-sepolia",
      symbol: "ETH",
      block_hash: blockHash,
      block_number: +blockNumber,
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
