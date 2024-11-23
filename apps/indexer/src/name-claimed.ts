import { Block, DECIMALS, hash, uint256, Pool, formatUnits } from "./deps.ts";
import { STARTING_BLOCK, NAMESERVICE_ADDRESS } from "./constants.ts";

const ConnectionString = Deno.env.get("POSTGRES_CONNECTION_STRING")!;
const pool = new Pool(ConnectionString, 1, true);
const connection = await pool.connect();

try {
  await connection.queryObject`
    DELETE FROM username_claimed
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
      fromAddress: NAMESERVICE_ADDRESS.SEPOLIA,
      keys: [hash.getSelectorFromName("UsernameClaimed")],
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
    tableName: "username_claimed",
  },
};

export default function DecodeUsernameClaimed({ header, events }: Block) {
  const { blockNumber, blockHash, timestamp } = header!;

  return (events ?? []).map(({ event, transaction }) => {
    if (!event.data || !event.keys) return;

    const transactionHash = transaction.meta.hash;
    const [_, address] = event.keys;

    const [
      username,
      expiry,
      paid_high,
      paid_low,
      quote_token
    ] = event.data;

    // const symbol_decoded = token_address
    //   ? shortString.decodeShortString(symbol.replace(/0x0+/, "0x"))
    //   : "";

    // const name_decoded = name
    //   ? shortString.decodeShortString(name.replace(/0x0+/, "0x"))
    //   : "";

    const paid_amount = uint256.uint256ToBN({
      low: paid_low,
      high: paid_high,
    });
    // const initial_supply = formatUnits(initial_supply_raw, DECIMALS).toString();

    // const total_supply_raw = uint256.uint256ToBN({
    //   low: total_supply_low,
    //   high: total_supply_high,
    // });
    // const total_supply = formatUnits(total_supply_raw, DECIMALS).toString();

    // console.log({
    //   memecoin_address: token_address,
    //   caller: caller,
    // });
    const amount_paid_formated = formatUnits(paid_amount, DECIMALS).toString();

    return {
      network: "starknet-sepolia",
      block_hash: blockHash,
      block_number: Number(blockNumber),
      block_timestamp: timestamp,
      transaction_hash: transactionHash,
      owner_address: address,
      name: username,
      username: username,
      expiry: expiry,
      paid:amount_paid_formated,
      quote_token:quote_token,
      created_at: new Date().toISOString(),
    };
  });
}
