import { defineIndexer } from '@apibara/indexer';
import { useLogger } from '@apibara/indexer/plugins';
import { drizzleStorage, useDrizzleStorage } from '@apibara/plugin-drizzle';
import { Abi, decodeEvent, StarknetStream } from '@apibara/starknet';
import { constants, encode, hash } from 'starknet';
import { ApibaraRuntimeConfig } from 'apibara/types';
import { db } from 'indexer-v2-db';
import { ABI as namespaceABI } from './abi/afkNamespace.abi';
import { formatUnits } from 'viem';
import { randomUUID } from 'crypto';
import { upsertTokenDeploy, upsertTokenLaunch, upsertTokenMetadata, upsertTokenTransaction } from './db/token.db';

const CREATE_TOKEN = hash.getSelectorFromName('CreateToken') as `0x${string}`;
const CREATE_LAUNCH = hash.getSelectorFromName('CreateLaunch') as `0x${string}`;
const LINKED_DEFAULT_STARKNET_ADDRESS = hash.getSelectorFromName('LinkedDefaultStarknetAddressEvent') as `0x${string}`;
const ADMIN_ADD_NOSTR_PROFILE = hash.getSelectorFromName('AdminAddNostrProfile') as `0x${string}`;
const PUSH_ALGO_SCORE_EVENT = hash.getSelectorFromName('PushAlgoScoreEvent') as `0x${string}`;
const METADATA_COIN_ADDED = hash.getSelectorFromName('MetadataCoinAdded') as `0x${string}`;
const BUY_TOKEN = hash.getSelectorFromName('BuyToken') as `0x${string}`;

const KNOWN_EVENT_KEYS = [
  CREATE_TOKEN,
  CREATE_LAUNCH,
  LINKED_DEFAULT_STARKNET_ADDRESS,
  ADMIN_ADD_NOSTR_PROFILE,
  PUSH_ALGO_SCORE_EVENT,
  METADATA_COIN_ADDED,
  BUY_TOKEN,
];

// Utility functions
const isNumeric = (str: string): boolean => {
  return /^\d+$/.test(str);
};

const isValidChar = (char: string): boolean => {
  return /^[a-zA-Z0-9\s\-_.!@#$%^&*()]+$/.test(char);
};

const cleanString = (str: string): string => {
  return str
    .split('')
    .filter((char) => isValidChar(char))
    .join('')
    .trim();
};

const formatTokenAmount = (amount: string, decimals: number = 18): string => {
  try {
    return formatUnits(BigInt(amount), decimals).toString();
  } catch (error) {
    console.error('Error formatting token amount:', error);
    return '0';
  }
};

export default function (config: ApibaraRuntimeConfig & {
  startingBlock: number,
  startingCursor: { orderKey: string }
}) {
  const {
    startingBlock,
  } = config;

  return defineIndexer(StarknetStream)({
    streamUrl: config.streamUrl as string,
    startingCursor: {
      orderKey: BigInt(config?.startingCursor?.orderKey ?? 533390),
    },
    filter: {
      events: [
        {
          address: "0x07607c8A50b83938ea3f9DA25DC1b7024814C0E5bF4B40bF6D6FF9Bc7387aa7d" as `0x${string}`,
          keys: KNOWN_EVENT_KEYS,
        },
      ],
    },
    plugins: [drizzleStorage({
      db,
    })],
    async transform({ endCursor, block, context, finality }) {
      const logger = useLogger();
      const { events, header } = block;

      logger.info(
        "Transforming block | orderKey: ",
        endCursor?.orderKey,
        " | finality: ",
        finality,
      );

      for (const event of events) {
        if (event.transactionHash) {
          logger.log(`Found event ${event.keys[0]}`);

          try {
            let sanitizedEventKey = encode.sanitizeHex(event.keys[0]);

            if (event.keys[0] == encode.sanitizeHex(CREATE_TOKEN)) {
              const decodedEvent = decodeEvent({
                abi: namespaceABI as Abi,
                event,
                eventName: 'afk_launchpad::types::launchpad_types::CreateToken',
              });
              await handleCreateTokenEvent(decodedEvent, event.address, header, event);
            } else if(event?.keys[0] == encode.sanitizeHex(CREATE_LAUNCH)) {
              const decodedEvent = decodeEvent({
                abi: namespaceABI as Abi,
                event,
                eventName: 'afk_launchpad::types::launchpad_types::CreateLaunch',
              });
              await handleCreateLaunch(decodedEvent, header, event);
            } else if(event?.keys[0] == encode.sanitizeHex(METADATA_COIN_ADDED)) {
              const decodedEvent = decodeEvent({
                abi: namespaceABI as Abi,
                event,
                eventName: 'afk_launchpad::types::launchpad_types::MetadataCoinAdded',
              });
              await handleMetadataEvent(decodedEvent, header, event);
            } else if(event?.keys[0] == encode.sanitizeHex(BUY_TOKEN)) {
              const decodedEvent = decodeEvent({
                abi: namespaceABI as Abi,
                event,
                eventName: 'afk_launchpad::types::launchpad_types::BuyToken',
              });
              await handleBuyTokenEvent(decodedEvent, header, event);
            }
          } catch (error: any) {
            logger.error(`Error processing event: ${error.message}`);
          }
        }
      }
    }
  });

  async function handleCreateTokenEvent(event: any, contractAddress: string, header: any, rawEvent: any) {
    try {
      const {
        blockNumber,
        blockHash: blockHashFelt,
        timestamp: blockTimestamp,
      } = header;

      const blockHash = encode.sanitizeHex(
        `0x${BigInt(blockHashFelt).toString(16)}`,
      );

      const transactionHash = encode.sanitizeHex(
        `0x${BigInt(rawEvent.transactionHash).toString(16)}`,
      );

      const [, callerFelt, tokenAddressFelt] = rawEvent.keys;
      
      let symbol = cleanString(event?.symbol || '');
      let name = cleanString(event?.name || '');
      let tokenAddress = event?.memecoin_address;
      let ownerAddress = event?.owner;
      let initialSupply = formatTokenAmount(event?.initial_supply || '0');
      let totalSupply = formatTokenAmount(event?.total_supply || '0');

      const data = {
        transaction_hash: transactionHash,
        network: 'starknet-sepolia',
        block_number: BigInt(blockNumber),
        block_hash: blockHash,
        block_timestamp: new Date(Number(blockTimestamp.seconds) * 1000),
        memecoin_address: tokenAddress,
        owner_address: ownerAddress,
        name,
        symbol,
        initial_supply: initialSupply,
        total_supply: totalSupply,
        created_at: new Date(),
      };

      await upsertTokenDeploy(data);
    } catch (error) {
      console.error("Error in handleCreateTokenEvent:", error);
    }
  }

  async function handleCreateLaunch(event: any, header: any, rawEvent: any) {
    try {
      const {
        blockNumber,
        blockHash: blockHashFelt,
        timestamp: blockTimestamp,
      } = header;

      const blockHash = encode.sanitizeHex(
        `0x${BigInt(blockHashFelt).toString(16)}`,
      );

      const transactionHash = encode.sanitizeHex(
        `0x${BigInt(rawEvent.transactionHash).toString(16)}`,
      );

      const data = {
        transaction_hash: transactionHash,
        network: 'starknet-sepolia',
        block_number: BigInt(blockNumber),
        block_hash: blockHash,
        block_timestamp: new Date(Number(blockTimestamp.seconds) * 1000),
        memecoin_address: event?.memecoin_address,
        owner_address: event?.owner,
        quote_token: event?.quote_token,
        exchange_name: event?.exchange_name,
        total_supply: formatTokenAmount(event?.total_supply || '0'),
        threshold_liquidity: formatTokenAmount(event?.threshold_liquidity || '0'),
        current_supply: formatTokenAmount(event?.current_supply || '0'),
        liquidity_raised: formatTokenAmount(event?.liquidity_raised || '0'),
        is_liquidity_added: event?.is_liquidity_added || false,
        total_token_holded: formatTokenAmount(event?.total_token_holded || '0'),
        price: formatTokenAmount(event?.price || '0'),
        bonding_type: event?.bonding_type,
        created_at: new Date(),
        initial_pool_supply_dex: formatTokenAmount(event?.initial_pool_supply_dex || '0'),
        market_cap: formatTokenAmount(event?.market_cap || '0'),
        name: cleanString(event?.name || ''),
        symbol: cleanString(event?.symbol || ''),
        token_deploy_tx_hash: event?.token_deploy_tx_hash,
      };

      await upsertTokenLaunch(data);
    } catch (error) {
      console.error("Error in handleCreateLaunch:", error);
    }
  }

  async function handleMetadataEvent(event: any, header: any, rawEvent: any) {
    try {
      const {
        blockNumber,
        blockHash: blockHashFelt,
        timestamp: blockTimestamp,
      } = header;

      const blockHash = encode.sanitizeHex(
        `0x${BigInt(blockHashFelt).toString(16)}`,
      );

      const transactionHash = encode.sanitizeHex(
        `0x${BigInt(rawEvent.transactionHash).toString(16)}`,
      );

      const data = {
        transaction_hash: transactionHash,
        network: 'starknet-sepolia',
        block_number: BigInt(blockNumber),
        block_hash: blockHash,
        block_timestamp: new Date(Number(blockTimestamp.seconds) * 1000),
        memecoin_address: event?.token_address,
        url: event?.url,
        nostr_event_id: event?.nostr_event_id,
        twitter: event?.twitter,
        telegram: event?.telegram,
        github: event?.github,
        website: event?.website,
        created_at: new Date(),
      };

      await upsertTokenMetadata(data);
    } catch (error) {
      console.error("Error in handleMetadataEvent:", error);
    }
  }

  async function handleBuyTokenEvent(event: any, header: any, rawEvent: any) {
    try {
      const {
        blockNumber,
        blockHash: blockHashFelt,
        timestamp: blockTimestamp,
      } = header;

      const blockHash = encode.sanitizeHex(
        `0x${BigInt(blockHashFelt).toString(16)}`,
      );

      const transactionHash = encode.sanitizeHex(
        `0x${BigInt(rawEvent.transactionHash).toString(16)}`,
      );

      const transferId = `${transactionHash}_${rawEvent.index}`;

      const [, callerFelt, tokenAddressFelt] = rawEvent.keys;

      const ownerAddress = encode.sanitizeHex(
        `0x${BigInt(callerFelt).toString(16)}`,
      );

      const tokenAddress = encode.sanitizeHex(
        `0x${BigInt(tokenAddressFelt).toString(16)}`,
      );

      const [
        amountLow,
        amountHigh,
        priceLow,
        priceHigh,
        protocolFeeLow,
        protocolFeeHigh,
        lastPriceLow,
        lastPriceHigh,
        timestampFelt,
        quoteAmountLow,
        quoteAmountHigh,
      ] = event.data;

      const amount = formatTokenAmount(
        (BigInt(amountHigh) << BigInt(128)) | BigInt(amountLow)
      );
      const price = formatTokenAmount(
        (BigInt(priceHigh) << BigInt(128)) | BigInt(priceLow)
      );
      const protocolFee = formatTokenAmount(
        (BigInt(protocolFeeHigh) << BigInt(128)) | BigInt(protocolFeeLow)
      );
      const lastPrice = formatTokenAmount(
        (BigInt(lastPriceHigh) << BigInt(128)) | BigInt(lastPriceLow)
      );
      const quoteAmount = formatTokenAmount(
        (BigInt(quoteAmountHigh) << BigInt(128)) | BigInt(quoteAmountLow)
      );

      const timestamp = new Date(Number(BigInt(timestampFelt)) * 1000);

      const data = {
        transfer_id: transferId,
        network: 'starknet-sepolia',
        block_hash: blockHash,
        block_number: BigInt(blockNumber),
        block_timestamp: new Date(Number(blockTimestamp.seconds) * 1000),
        transaction_hash: transactionHash,
        memecoin_address: tokenAddress,
        owner_address: ownerAddress,
        last_price: lastPrice,
        quote_amount: quoteAmount,
        price: price,
        amount: amount,
        protocol_fee: protocolFee,
        time_stamp: timestamp,
        transaction_type: 'buy',
      };

      await upsertTokenTransaction(data);
    } catch (error) {
      console.error("Error in handleBuyTokenEvent:", error);
    }
  }
} 