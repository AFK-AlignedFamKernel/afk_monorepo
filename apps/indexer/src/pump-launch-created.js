// import { Block, hash, shortString, uint256 } from './deps.js'
import { FACTORY_ADDRESS, LAUNCHPAD_ADDRESS, STARTING_BLOCK } from './constants.js'

// export const FACTORY_ADDRESS = '0x01a46467a9246f45c8c340f1f155266a26a71c07bd55d36e8d1c7d0d438a2dbc'
// export const STARTING_BLOCK = 615556
// export const LAUNCHPAD_ADDRESS = {
//     SEPOLIA:"0x74acb6752abb734a7b3388567429217988e02409d9bf43c5586dc2c4f8baf40",
// }
import { hash, uint256, shortString } from "https://esm.run/starknet@5.14";
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
  // startingBlock: STARTING_BLOCK,
  startingBlock: 100_000,
  network: 'starknet',
  finality: 'DATA_STATUS_ACCEPTED',
  filter,
  sinkType: 'postgres',
  sinkOptions: {
    connectionString: '',
    tableName: 'token_deploy',
  },
}

export default function DecodeTokenLaunchDeploy({ header, events }) {
  const { blockNumber, blockHash, timestamp } = header;

  return (events ?? []).map(({ event, transaction }) => {
    if (!event.data) return

    const transactionHash = transaction.meta.hash
    console.log("event data", event?.data)

    const [owner, token_address, name, symbol, initial_supply_low, initial_supply_high, total_supply_low, total_supply_high] = event.data
    console.log("owner", owner)
    console.log("token_address", token_address)
    console.log("name", name)
    console.log("symbol", symbol)

    const name_decoded = shortString.decodeShortString(name.replace(/0x0+/, '0x'))
    const symbol_decoded = shortString.decodeShortString(symbol.replace(/0x0+/, '0x'))
    const initial_supply = uint256.uint256ToBN({ low: initial_supply_low, high: initial_supply_high }).toString()
 
    console.log("initial_supply", initial_supply)
    const total_supply = uint256.uint256ToBN({ low: total_supply_low, high: total_supply_high }).toString()
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
      initial_supply: initial_supply,
      created_at: new Date().toISOString(),
    }
  })
}
