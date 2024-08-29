// import { Block, hash, shortString, uint256 } from './deps.js'
import { FACTORY_ADDRESS, LAUNCHPAD_ADDRESS, STARTING_BLOCK } from './constants.js'
import { hash, uint256, shortString, cairo } from "https://esm.run/starknet@5.14";
import { formatUnits } from "https://esm.run/viem@1.4";

const filter = {
  header: {
    weak: true,
  },
  events: [
    {
      fromAddress: LAUNCHPAD_ADDRESS.SEPOLIA,
      keys: [hash.getSelectorFromName('CreateLaunch')],
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
  sinkType: 'postgres',
  sinkOptions: {
    connectionString: '',
    tableName: 'token_launch',
  },
}

export default function DecodeTokenLaunchDeploy({ header, events }) {
  const { blockNumber, blockHash, timestamp } = header;

  return (events ?? []).map(({ event, transaction }) => {
    if (!event.data) return

    const transactionHash = transaction.meta.hash
    console.log("event data", event?.data)

    const [owner, token_address, ] = event.keys
    const [name, symbol, initial_supply_low, initial_supply_high, total_supply_low, total_supply_high] = event.data
    console.log("owner", owner)
    console.log("token_address", token_address)
    console.log("name", name)
    console.log("symbol", symbol)
    console.log("initial_supply_low", initial_supply_low)
    console.log("total_supply_low", total_supply_low)

    const name_decoded = shortString.decodeShortString(name.replace(/0x0+/, '0x'))
    const symbol_decoded = shortString.decodeShortString(symbol.replace(/0x0+/, '0x'))
    const quote_token_decoded = token_address ? shortString.decodeShortString(token_address.replace(/0x0+/, '0x')) : '';
    const exchange_name_decoded = exchange_name ? shortString.decodeShortString(exchange_name.replace(/0x0+/, '0x')) : '';
    const price_decoded = price ? shortString.decodeShortString(price.replace(/0x0+/, '0x')) : '';
    const liquidity_raised_decoded = liquidity_raised ? uint256.uint256ToBN({ low: liquidity_raised, high: 0 }).toString() : '0';

    let total_supply= cairo.uint256(0)
    if(total_supply_high && total_supply_low) {
      total_supply = uint256.uint256ToBN({ low: total_supply_low, high: total_supply_high }).toString()

    }
    console.log("total_supply", total_supply)

    return {
      network: 'starknet-sepolia',
      block_hash: blockHash,
      block_number: Number(blockNumber),
      block_timestamp: timestamp,
      transaction_hash: transactionHash,
      memecoin_address: token_address,
      quote_token: quote_token_decoded,
      exchange_name: exchange_name_decoded,
      created_at: new Date().toISOString(),
      total_supply,
      current_supply,
      liquidity_raised: liquidity_raised_decoded,
      price: price_decoded,
      _cursor: transaction.meta.cursor,
      timestamp: new Date(timestamp * 1000).toISOString(),

    }
  })
}
