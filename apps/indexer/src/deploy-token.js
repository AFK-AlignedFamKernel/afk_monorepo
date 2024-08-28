import { hash, uint256, shortString } from "https://esm.run/starknet@5.14";
import { STARTING_BLOCK, LAUNCHPAD_ADDRESS } from "./constants";

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
        connectionString: 'Your Connection String Here',
        tableName: 'token_launch',
    },
}

export default function DecodeTokenLaunchDeploy({ header, events }) {
    const { blockNumber, blockHash, timestamp } = header;

    return (events ?? []).map(({ event, transaction }) => {
        if (!event.data) return;

        const transactionHash = transaction.meta.hash;
        const [
            owner, 
            token_address,
            name,
            symbol,
            initial_supply_low, 
            initial_supply_high, 
            total_supply_low, 
            total_supply_high,
            quote_token,
            exchange_name,
            price
        ] = event.data;

        const initial_supply = uint256.uint256ToBN({ low: initial_supply_low, high: initial_supply_high }).toString();
        const total_supply = uint256.uint256ToBN({ low: total_supply_low, high: total_supply_high }).toString();
        const name_decoded = shortString.decodeShortString(name);
        const symbol_decoded = shortString.decodeShortString(symbol);
        const price_decoded = price ? formatUnits(price, 18) : '0';

        return {
            network: 'starknet-sepolia',
            block_hash: blockHash,
            block_number: Number(blockNumber),
            block_timestamp: new Date(timestamp * 1000).toISOString(),
            transaction_hash: transactionHash,
            memecoin_address: token_address,
            owner_address: owner,
            name: name_decoded,
            symbol: symbol_decoded,
            initial_supply,
            total_supply,
            quote_token: quote_token ? shortString.decodeShortString(quote_token) : '',
            exchange_name: exchange_name ? shortString.decodeShortString(exchange_name) : '',
            price: price_decoded,
            created_at: new Date().toISOString(),
            cursor: transaction.meta.cursor,
        };
    });
}