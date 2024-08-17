import { hash, uint256 } from "https://esm.run/starknet@5.14";
import { STARTING_BLOCK, LAUNCHPAD_ADDRESS} from "./constants";

const filter = {
  header: {
    weak: true,
  },
  events: [
    {
      fromAddress: LAUNCHPAD_ADDRESS.SEPOLIA,
      keys: [hash.getSelectorFromName('BuyToken')],
      includeReceipt: false,
    },
  ],
}

export const config = {
  streamUrl: 'https://sepolia.starknet.a5a.ch',
  startingBlock: STARTING_BLOCK,
  network: 'starknet',
  finality: 'DATA_STATUS_ACCEPTED',
  filter,
  // sinkType: "console",
  // sinkOptions: {},
  sinkType: 'postgres',
  sinkOptions: {
    connectionString: '',
    tableName: 'buy_token',
  },
}

export default function DecodeBuyToken({ header, events }) {
  const { blockNumber, blockHash, timestamp } = header

  return (events ?? []).map(({ event, transaction }) => {
    if (!event.data) return

    const transactionHash = transaction.meta.hash


    // console.log("event data", event?.data)
    // return {
    //   transactionHash,
    //   block_hash: blockHash,
    //   block_number: +blockNumber,
    //   block_timestamp: timestamp,
    //   transaction_hash: transactionHash,
    //   transfer_id: transferId,
    //   from_address: fromAddress,
    // }

    const [caller, 
      token_address,
      amount_low,
       amount_high,
      price_low, 
      price_high,
      protocol_fee_low, 
      protocol_fee_high,
      initial_supply_low, 
      initial_supply_high, 
      // total_supply_low, total_supply_high,
    
    ] = event.data;
    const amount = uint256.uint256ToBN({ low: amount_low, high: amount_high }).toString()
    const initial_supply = uint256.uint256ToBN({ low: initial_supply_low, high: initial_supply_high }).toString()
    // const total_supply = uint256.uint256ToBN({ low: total_supply_low, high: total_supply_high }).toString()
    const price = uint256.uint256ToBN({ low: price_low, high: price_high }).toString()
    const protocol_fee = uint256.uint256ToBN({ low: protocol_fee_low, high: protocol_fee_high }).toString()

    return {
      network: 'starknet-sepolia',
      block_hash: blockHash,
      block_number: Number(blockNumber),
      block_timestamp: timestamp,
      transaction_hash: transactionHash,
      memecoin_address: token_address,
      owner_address: caller,
      initial_supply: initial_supply,
      // total_supply: total_supply,
      price:price,
      protocol_fee:protocol_fee,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
  })
}
