import { Block, hash, uint256 } from './deps.js'
import { FACTORY_ADDRESS, LAUNCHPAD_ADDRESS, STARTING_BLOCK } from './constants.js'

export const config = {
  filter: {
    header: { weak: true },
    events: [
      {
        fromAddress: LAUNCHPAD_ADDRESS.SEPOLIA,
        keys: [hash.getSelectorFromName('CreateLaunch')],
        includeReceipt: false,
      },
    ],
  },
  streamUrl: 'https://sepolia.starknet.a5a.ch',
  startingBlock: STARTING_BLOCK,
  network: 'starknet',
  finality: 'DATA_STATUS_ACCEPTED',
  sinkType: 'postgres',
  sinkOptions: {
    connectionString: '',
    tableName: 'token_launch',
  },
}


export default function DecodeTokenLaunch({ header, events }: Block) {
  const { blockNumber, blockHash, timestamp } = header!

  return (events ?? []).map(({ event, transaction }) => {
    if (!event.data || !event.keys) return

    const [caller, token_address, amount, price] = event.data


    const transactionHash = transaction.meta.hash
    const transferId = `${transactionHash}_${event.index ?? 0}`
    const fromAddress = event.keys[1]
    const toAddress = event.keys[2]
    // const caller = uint256.uint256ToBN({ low: event.data[0], high: event.data[1] })
    // const amount = uint256.uint256ToBN({ low: event.data[0], high: event.data[1] })

    return {
      network: 'starknet-sepolia',
      block_hash: blockHash,
      block_number: Number(blockNumber),
      block_timestamp: timestamp,
      transaction_hash: transactionHash,
      transfer_id: transferId,
      from_address: fromAddress,
      to_address: toAddress,
      memecoin_address: token_address,
      amount: amount.toString(10),
      created_at: new Date().toISOString(),
    }
  })
}
