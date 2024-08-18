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
  // sinkType: 'console',
  // sinkOptions: {
  //   connectionString: "",
  // },
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
    // const initial_supply = uint256.uint256ToBN({ low: initial_supply_low, high: initial_supply_high }).toString()
 
    // console.log("initial_supply", initial_supply)

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
      owner_address: owner,
      name: name_decoded,
      symbol: symbol_decoded,
      // initial_supply: initial_supply,
      created_at: new Date().toISOString(),
    }
  })
}
